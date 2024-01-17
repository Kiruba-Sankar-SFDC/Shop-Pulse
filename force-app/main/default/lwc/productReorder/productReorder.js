import { LightningElement, track, wire } from 'lwc';
import getReorderProducts from '@salesforce/apex/ProductHandler.getReorderProducts';
import getProducts from '@salesforce/apex/ProductHandler.getProducts'
import generateReorderAndReorderLineItems from '@salesforce/apex/GenerateReorderLineItems.generateReorderAndReorderLineItems';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ProductReorder extends LightningElement {
    @track showTable = false;
    showSuccessMessage = false;
    @track data = [];
    initialRecords;
    @track allProductsData = [];
    selectedRows = [];
    reorderColumns = [
        //{ label: 'Supplier Name', fieldName: 'supplierName', type: 'text' },
        { label: 'Product Name', fieldName: 'productName', type: 'text', cellAttributes: { alignment: 'center' } },
        { label: 'Quantity to Reorder', fieldName: 'quantityToReorder', editable: true, cellAttributes: { alignment: 'center' } },
        { label: '', type: 'button', initialWidth: 75, typeAttributes: { label: '', name: 'delete', title: '', variant: 'destructive', iconName: 'utility:delete' }, cellAttributes: { alignment: 'center' } }
    ];

    columns = [
        { label: 'Product Name', fieldName: 'Name' },
        { label: 'Product Code', fieldName: 'ProductCode' },
        //{ label: 'Unit Price', fieldName: 'UnitPrice', displayReadOnlyIcon: true },
        { label: 'Quantity', fieldName: 'Quantity__c', editable: false }
    ]

    @wire(getReorderProducts)
    getReorderProductsFunction({ data, error }) {
        if (data) {
            this.segregateBySuppliers(data);
        }
        else if (error) {
            console.error(error);
        }
    }

    segregateBySuppliers(result) {
        let groupedProducts = {};
        result.forEach(product => {
            if (!groupedProducts[product.Supplier__c]) {
                groupedProducts[product.Supplier__c] = {
                    supplierId: product.Supplier__c,
                    supplierName: product.Supplier_Name__c,
                    products: []
                };
            }
            groupedProducts[product.Supplier__c].products.push({
                id: product.Id,
                quantityToReorder: 50,
                productName: product.Name,
                productQuantity: product.Quanitity__c,
                supplierId: product.Supplier__c
            });
        });

        this.data = Object.values(groupedProducts);
        if (this.selectedRows.length > 0) {
            this.data = [...this.data, ...this.selectedRows];
        }
        this.showTable = true;
        console.log(JSON.stringify(this.data));
    }

    handleRowSelection(event) {
        this.selectedRows = event.detail.selectedRows;
        console.log(JSON.stringify(this.selectedRows));
        if (this.selectedRows.length > 0) {
            let productsToAdd = this.selectedRows.filter(selectedProduct => {
                return !this.data.some(product => product.supplierId === selectedProduct.Supplier__c && product.products.some(p => p.id === selectedProduct.Id));
            });

            let newData = [...this.data]; // Create a copy of the existing data array

            productsToAdd.forEach(selectedProduct => {
                let existingSupplierIndex = newData.findIndex(supplier => supplier.supplierId === selectedProduct.Supplier__c);
                if (existingSupplierIndex !== -1) {
                    // Supplier already exists, update its products array
                    newData[existingSupplierIndex] = {
                        ...newData[existingSupplierIndex],
                        products: [...newData[existingSupplierIndex].products, {
                            id: selectedProduct.Id,
                            productName: selectedProduct.Name,
                            productQuantity: selectedProduct.Quanitity__c,
                            quantityToReorder: 50,
                            supplierId: selectedProduct.Supplier__c,
                        }]
                    };
                } else {
                    // Supplier doesn't exist, create a new supplier entry
                    newData.push({
                        supplierId: selectedProduct.Supplier__c,
                        supplierName: selectedProduct.Supplier_Name__c,
                        products: [{
                            id: selectedProduct.Id,
                            productName: selectedProduct.Name,
                            productQuantity: selectedProduct.Quanitity__c,
                            quantityToReorder: 50,
                            supplierId: selectedProduct.Supplier__c,

                        }]
                    });
                }
            });

            this.data = newData; // Update the component's data property to trigger reactivity
            this.showTable = true;
        } else {
            // Handle deselection if needed
        }
    }

    @wire(getProducts)
    getAllProducts({ data, error }) {
        if (data) {
            this.initialRecords = data;
        }
        this.handleSearch();
    }

    handleSearch(event) {
        console.log(event);
        let searchKey = '';
        //searchKey = event.target.value.toLowerCase();
        searchKey += event ? event.target.value.toLowerCase() : 'a';
        console.log('Inside handleSearch');

        if (searchKey) {
            this.allProductsData = this.initialRecords;

            if (this.allProductsData) {
                let searchRecords = [];

                for (let record of this.allProductsData) {
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
                this.allProductsData = searchRecords.slice(0, 10);
            }
        } else {
            this.allProductsData = this.initialRecords.slice(0, 10);
        }
    }

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        console.log(JSON.stringify(row));
        if (action.name === 'delete') {
            const supplierId = row.supplierId;
            const productId = row.id;

            // Find the supplier in this.data
            const supplierIndex = this.data.findIndex(supplier => supplier.supplierId === supplierId);
            console.log('Supplier Index : ' + supplierIndex);

            // Check if the supplier was found
            if (supplierIndex !== -1) {
                // Find the index of the product to be deleted within the supplier's products array
                const productIndex = this.data[supplierIndex].products.findIndex(product => product.id === productId);
                console.log('Product Index : ' + productIndex);

                // Remove the product from the supplier's products array
                if (productIndex !== -1) {
                    // Create a copy of the products array and remove the specific product
                    let afterRemoveProducts = [...this.data[supplierIndex].products];
                    afterRemoveProducts.splice(productIndex, 1);

                    // Update this.data with the modified products array
                    this.data[supplierIndex].products = afterRemoveProducts;
                    if (this.data[supplierIndex].products.length === 0) {
                        this.data.splice(supplierIndex, 1);
                    }
                    console.log(JSON.stringify(this.data));
                }
            }
        }
    }

    handleReorder(event) {
        const dataToSend = this.data.map(supplier => {
            return {
                supplierId: supplier.supplierId,
                supplierName: supplier.supplierName,
                products: supplier.products.map(product => {
                    return {
                        id: product.id,
                        quantityToReorder: product.quantityToReorder,
                        productName: product.productName
                    };
                })
            };
        });

        generateReorderAndReorderLineItems({ allReorderProducts: dataToSend })
            .then(() => {
                console.log(JSON.stringify(this.data));
                console.log("Successfully entered the function");
                this.showSuccessMessage = true; // Set the flag to display the success message
                this.showTable = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!',
                        message: 'Reorder Placed Successfully.',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                console.error("Error: " + JSON.stringify(error));
            });
    }

    handleQuantityChange(event) {
        const editedQuantity = event.detail.draftValues[0].quantityToReorder;

        const productId = event.detail.draftValues[0].id;

        const supplierIndex = this.data.findIndex(supplier => supplier.products.find(product => product.id === productId));

        // Find the product index within the supplier's products array
        const productIndex = this.data[supplierIndex].products.findIndex(product => product.id === productId);

        // Update the quantity in this.data
        if (supplierIndex !== -1 && productIndex !== -1) {
            this.data[supplierIndex].products[productIndex].quantityToReorder = editedQuantity;

            // Update the component's data property to trigger re-rendering of the table
            this.data = [...this.data];
        }
    }


}