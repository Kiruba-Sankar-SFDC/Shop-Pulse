public with sharing class EmailHandler {
    
    @AuraEnabled
    public static void sendEmailWithPDF(List<Product2> products, Supplier__c supplier) {
        // Generate PDF content
        String pdfContent = generatePDF(products, supplier);
        
        // Create a new email message
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        
        // Set recipient email address
        email.setToAddresses(new List<String>{supplier.Email_Id__c}); // Replace with supplier's email
        
        // Set email subject and body
        email.setSubject('Products to Reorder');
        email.setPlainTextBody('Please find attached products to reorder.');
        email.setHtmlBody(pdfContent);
     
        // Send the email
        Messaging.SendEmailResult[] results = Messaging.sendEmail(new Messaging.SingleEmailMessage[]{email});
        
        // Handle the email send results if needed
        if (results[0].isSuccess()) {
            System.debug('Email sent successfully');
        } else {
            System.debug('Email failed to send: ' + results[0].getErrors()[0].getMessage());
        }
    }
    
    public static String generatePDF(List<Product2> products, Supplier__c supplier) {
        // Logic to generate PDF content from products data
        // Return PDF content as a String
        // Example:
        String productData = '';
        productData += '<h4>' + System.today() +  '</h4>';
        productData += '<h1>' + 'HI '+supplier.Name +' HERE ARE PRODUCTS TO REORDER FROM SHOPPULSE! ' + '</h1>';
        productData += '<tr><th>' + ' Product Name ' + '</th><th>' + ' Reorder Quantity ' + '</th></tr>';
        productData += '<tr><td>' + '-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------' + '</td></tr>';
        for (Product2 data : products) {
            productData += '<tr><th>' + data.Name + '</th><th>' + data.Quantity_To_Reorder__c + '</th></tr>';
            productData += '<tr><td>' + '-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------' + '</td></tr>';
            
        }
        System.debug(productData);
        return productData; 
    }
}