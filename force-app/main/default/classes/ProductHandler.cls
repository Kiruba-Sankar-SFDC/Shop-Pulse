public class ProductHandler {
    
    @AuraEnabled(cacheable = True)
    public static List<Product2> getReorderProducts() {
        return [SELECT Id, Name, Supplier_Name__c, Supplier__c, Quantity__c FROM Product2 Where Is_Reached_Threshold__c = TRUE];
    }

    @AuraEnabled(cacheable = True)
    public static List<Product2> getProducts(){
        return [Select Id, Name, Quantity__c, ProductCode,Supplier__c, Supplier_Name__c  From Product2 Order By Quantity__c];
    }
}