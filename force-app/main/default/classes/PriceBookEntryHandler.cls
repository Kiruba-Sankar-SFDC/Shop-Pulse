public class PriceBookEntryHandler 
{
    @AuraEnabled(cacheable = true)
    public static List<PricebookEntry> getPriceBookEntries(string priceBookId)
    {
        return [ Select Name, Product2Id, ProductCode, UnitPrice, Quantity__c, Pricebook2Id, Total_Price__c From PricebookEntry Where Pricebook2Id=:priceBookId AND Quantity__c > 0];
    }

   @AuraEnabled(cacheable = true)
   public static List<PriceBook2> getPriceBooks(){
    try {
        return [ Select Id, Name From Pricebook2];
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
   }

   @AuraEnabled
    public static List<PriceBookEntry> updateQuantity(Object priceBookEntryObjectToUpdate, Object allPriceBookEntries){
        List<PriceBookEntry> priceBookEntryList = (List<PriceBookEntry>) JSON.deserialize(JSON.serialize(priceBookEntryObjectToUpdate), List<PriceBookEntry>.class);
        List<PriceBookEntry> allPriceBookEntry = (List<PriceBookEntry>) JSON.deserialize(JSON.serialize(allPriceBookEntries), List<PriceBookEntry>.class);
        system.debug(allPriceBookEntry);
        Set<Id> priceBookId = new Set<Id>();
        for(PriceBookEntry eachPriceBookEntry: allPriceBookEntry)
        {
            priceBookId.add(eachPriceBookEntry.Id);
        }
        system.debug(priceBookEntryList);
        
        if(priceBookEntryList.size() > 0){
            update priceBookEntryList;
            List<PriceBookEntry> updatedPriceBookEntry = [Select Pricebook2Id, Name, Product2Id, ProductCode, UnitPrice, Quantity__c, Total_Price__c From PriceBookEntry Where Id In:priceBookId];
            system.debug('Updated successfully');
            return updatedPriceBookEntry;
        }
        return null;
    }
}