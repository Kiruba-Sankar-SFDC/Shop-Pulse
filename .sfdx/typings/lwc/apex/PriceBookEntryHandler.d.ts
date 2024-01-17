declare module "@salesforce/apex/PriceBookEntryHandler.getPriceBookEntries" {
  export default function getPriceBookEntries(param: {priceBookId: any}): Promise<any>;
}
declare module "@salesforce/apex/PriceBookEntryHandler.getPriceBooks" {
  export default function getPriceBooks(): Promise<any>;
}
declare module "@salesforce/apex/PriceBookEntryHandler.updateQuantity" {
  export default function updateQuantity(param: {priceBookEntryObjectToUpdate: any, allPriceBookEntries: any}): Promise<any>;
}
