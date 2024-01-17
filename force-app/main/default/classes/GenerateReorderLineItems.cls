public class GenerateReorderLineItems {
    
    @AuraEnabled(cacheable=true)
    public static void generateReorderAndReorderLineItems(Object allReorderProducts) {
        System.debug(allReorderProducts);
        String reorderDataJson = JSON.serialize(allReorderProducts);
        
        // Deserialize the JSON string to ReorderData
        ReorderData[] reorderDataList = (ReorderData[]) JSON.deserialize(reorderDataJson, List<ReorderData>.class);
        Map<Id, List<Product2>> supplierIdMapsProducts = new Map<Id, List<Product2>>();
        
        //System.debug(reorderDataList);
        for(ReorderData eachReorderData : reorderDataList){
            for(ProductData eachProductData : eachReorderData.products){
                if(!supplierIdMapsProducts.containsKey(eachReorderData.supplierId)){
                    Product2 product = new Product2(Id = eachProductData.id, Quantity_To_Reorder__c = eachProductData.quantityToReorder, Name = eachProductData.productName);
                    List<Product2> productList = new List<Product2>{product};
                    supplierIdMapsProducts.put(eachReorderData.supplierId, productList);
                }
                else{
                    List<Product2> oldProductList = supplierIdMapsProducts.get(eachReorderData.supplierId);
                    Product2 product = new Product2(Id = eachProductData.id, Quantity_To_Reorder__c = eachProductData.quantityToReorder, Name = eachProductData.productName);
                    oldProductList.add(product);
                    supplierIdMapsProducts.put(eachReorderData.supplierId, oldProductList);
                }
            }
        }
        
        Map<Id, Supplier__c> supplierMap = new Map<Id, Supplier__c>([Select Id, Name, Email_Id__c From Supplier__c Where Id In: supplierIdMapsProducts.keySet()]);
        System.debug(supplierIdMapsProducts);
        System.debug(supplierMap);
        
        for(Id supplierId : supplierIdMapsProducts.keySet()){
            EmailHandler.sendEmailWithPDF(supplierIdMapsProducts.get(supplierId) ,supplierMap.get(supplierId));
        }
    }
}