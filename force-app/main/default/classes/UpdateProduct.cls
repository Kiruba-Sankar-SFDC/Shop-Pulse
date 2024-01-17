public class UpdateProduct
{
	@InvocableMethod
    public static void updateProductQuantity(List<List<PricebookEntry>> pricebookEntriesList)
    {
         string retailPriceBookId = '01s5j00000MfdrFAAR';
         string wholesalePriceBookId = '01s5j00000Olu9WAAR';
       
        List<PriceBookEntry> priceBookEntryList = pricebookEntriesList[0];
        
        Set<Id> productIds = new Set<Id>();
        
        for(PriceBookEntry eachPriceBookEntry: priceBookEntryList)
        {
            productIds.add(eachPriceBookEntry.Product2Id);
        }
        
        Map<Id, Product2> productMap = new Map<Id, Product2>([Select Quantity__c ,Quantity_Sold_At_Retail_Price__c, Quantity_Sold_At_Wholesale_Price__c From Product2 Where Id In: productIds]);
        system.debug(productMap);
        
        List<Product2> productsToUpdate = new List<Product2>();
        
        List<PriceBookEntry> priceBookEntryToUpdate = new List<PriceBookEntry>();
        
        for(PriceBookEntry eachPriceBookEntry: priceBookEntryList)
        {
            if(productMap.containsKey(eachPriceBookEntry.Product2Id))
            {
                Product2 getProduct = productMap.get(eachPriceBookEntry.Product2Id);
                getProduct.Quantity__c -= eachPriceBookEntry.Quantity__c;
                
                if(eachPriceBookEntry.Pricebook2Id == retailPriceBookId)
                {
                    if(getProduct.Quantity_Sold_At_Retail_Price__c == Null)
                    {
                        getProduct.Quantity_Sold_At_Retail_Price__c = 0;
                    }
                    getProduct.Quantity_Sold_At_Retail_Price__c += eachPriceBookEntry.Quantity__c;
                }
                else
                {
                    if(getProduct.Quantity_Sold_At_Wholesale_Price__c == Null)
                    {
                        getProduct.Quantity_Sold_At_Wholesale_Price__c = 0;
                    }
                    getProduct.Quantity_Sold_At_Wholesale_Price__c += eachPriceBookEntry.Quantity__c;
                }
                
                productsToUpdate.add(getProduct);
            }
            
            eachPriceBookEntry.Quantity__c = 1;
            
            priceBookEntryToUpdate.add(eachPriceBookEntry);
		}
        system.debug(productsToUpdate);
        if(productsToUpdate.size()>0)
            update productsToUpdate;
        
        system.debug(priceBookEntryToUpdate);
        if(priceBookEntryToUpdate.size() > 0)
            update priceBookEntryToUpdate;
    }
}