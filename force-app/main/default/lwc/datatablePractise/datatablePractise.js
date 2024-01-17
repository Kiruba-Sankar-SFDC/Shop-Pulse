import { LightningElement, wire, track, api } from 'lwc';
import getPriceBookEntries from '@salesforce/apex/PriceBookEntryHandler.getPriceBookEntries';
import getPriceBooks from '@salesforce/apex/PriceBookEntryHandler.getPriceBooks';
import updateQuantity from '@salesforce/apex/PriceBookEntryHandler.updateQuantity';

export default class DatatablePractise extends LightningElement {

    @track selectedRows = [];
    initialRecords;
    @track data;
    @track priceBooks;
    @api priceBookId;

    @api
    get selectedProducts() {
        console.log('GET SELECTED PRODUCTS::::: ' + JSON.stringify(this.selectedRows));
        return JSON.stringify(this.selectedRows);
    }
    set selectedProducts(value) {
        console.log('SET SELECTED PRODUCTS::::: ' + JSON.parse(value));

        // You can parse the JSON string to get the latest selected products
        this.selectedRows = JSON.parse(value);
    }

    draftValues = [];
    connectedCallback() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        //document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    columns = [
        { label: 'Product Name', fieldName: 'Name' },
        { label: 'Product Code', fieldName: 'ProductCode' },
        { label: 'Unit Price', fieldName: 'UnitPrice', displayReadOnlyIcon: true },
        //{ label: 'Quantity', fieldName: 'Quantity__c', editable: true }
    ]

    selectedColumns = [
        { label: 'Product Name', fieldName: 'Name', cellAttributes: { alignment: 'center' } },
        { label: 'Product Code', fieldName: 'ProductCode', cellAttributes: { alignment: 'center' } },
        { label: 'Unit Price', fieldName: 'UnitPrice', cellAttributes: { alignment: 'center' } },
        { label: 'Quantity', fieldName: 'Quantity__c', editable: true, cellAttributes: { alignment: 'center' } },
        {
            label: 'Total Price', fieldName: 'Total_Price__c', type: 'currency', editable: false,
            typeAttributes: { currencyCode: 'INR' },
            cellAttributes: { alignment: 'center' },
            initialWidth: 150,
            calculateCellValue: function (row, column, cellValue) {
                return row.Quantity__c * row.UnitPrice;
            }
        },
        {
            label: '', type: 'button', initialWidth: 75, typeAttributes:
                { label: '', name: 'delete', title: 'Delete', variant: 'destructive', iconName: 'utility:delete' },
            cellAttributes: { alignment: 'center' }
        }
    ]

    get totalAmount() {
        let total = 0;
        if (this.selectedRows && this.selectedRows.length > 0) {
            total = this.selectedRows.reduce((acc, row) => acc + row.Quantity__c * row.UnitPrice, 0);
        }
        console.log(total);
        const formattedTotal = total.toLocaleString('en-IN');
        return ` Total Amount: ${formattedTotal}`;
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        console.log(actionName);
        let row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this.deleteRow(row);
                break;
            default:
                break;
        }
    }

    deleteRow(row) {
        console.log("Inside deleteRow");
        console.log(row.Id);
        const Id = row.Id;
        const index = this.findRowIndexById(Id);
        if (index !== -1) {
            console.log(this.selectedRows);
            this.selectedRows = this.selectedRows.slice(0, index).concat(this.selectedRows.slice(index + 1));
        }
    }

    findRowIndexById(id) {
        let ret = -1;
        this.selectedRows.some((row, index) => {
            if (row.Id === id) {
                ret = index;
                return true;
            }
            return false;
        });
        return ret;
    }

    @wire(getPriceBooks)
    priceBookCollection({ data, error }) {
        if (data) {
            console.log(data);
            this.priceBooks = data.map(priceBook => {
                return { label: priceBook.Name, value: priceBook.Id };
            });
            console.log('Price Books : ' + this.priceBooks);
        } else if (error) {
            console.error(error);
        }
    }


    @wire(getPriceBookEntries, { priceBookId: '$priceBookId' })
    priceBookEntryCollection({ data, error }) {
        if (data) {
            this.initialRecords = data;
            this.handleSearch();
        }
        if (error) {
            console.log(error);
        }
    }

    handlePriceBookChange(event) {
        this.priceBookId = event.detail.value;
    }

    onselectHandler(event) {
        const newSelectedRows = event.detail.selectedRows;
        const uniqueNewSelectedRows = newSelectedRows.filter(row =>
            !this.selectedRows.some(selectedRow => selectedRow.Id === row.Id)
        );
        this.selectedRows = [...this.selectedRows, ...uniqueNewSelectedRows];
    }

    handleSearch(event) {
        let searchKey = '';
        searchKey += event ? event.target.value.toLowerCase() : 'a';
        console.log('Inside handleSearch');

        if (searchKey) {
            this.data = this.initialRecords;

            if (this.data) {
                let searchRecords = [];

                for (let record of this.data) {
                    let valuesArray = Object.values(record);
                    console.log('Values Array : ' + valuesArray);
                    for (let val of valuesArray) {
                        // console.log('val is ' + val);
                        let strVal = String(val);
                        if (strVal) {
                            if (strVal.toLowerCase().includes(searchKey)) {
                                searchRecords.push(record);
                                break;
                            }
                        }
                    }
                }
                console.log('Matched Accounts are ' + JSON.stringify(searchRecords));
                this.data = searchRecords.slice(0, 10);
            }
        } else {
            this.data = this.initialRecords
        }
    }

    handleSave(event) {
        console.log(JSON.stringify(this.selectedRows));
        console.log(event.detail.draftValues);
        this.draftValues = event.detail.draftValues;
        updateQuantity({ priceBookEntryObjectToUpdate: this.draftValues, allPriceBookEntries: this.selectedRows })
            .then((result) => {
                console.log(result);
                console.log('FINAL RESULT' + JSON.stringify(result));
                this.selectedProducts = JSON.stringify(result);
            })
            .catch(err => console.log(err));
    }

    //Add Event Listeners Here.
    handleKeyDown(event) {
        if (event.key === 'F' || event.key === 'f') {
            const searchField = this.template.querySelector('.searchField');
            console.log(searchField);
            if (searchField) {
                searchField.focus();
            }
        }
    }
}