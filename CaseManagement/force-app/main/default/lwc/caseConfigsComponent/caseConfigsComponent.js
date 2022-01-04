import { LightningElement, wire, api, track } from 'lwc';
import retrivecaseConfig from '@salesforce/apex/CaseManagement.retrivecaseConfig';
import callExternalService from '@salesforce/apex/CaseManagement.callExternalService';
import retrivecaseStatus from '@salesforce/apex/CaseManagement.retrivecaseStatus';
import { refreshApex } from '@salesforce/apex';
import { updateRecord } from 'lightning/uiRecordApi';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Case_OBJECT from "@salesforce/schema/Case";
import ID_FIELD from '@salesforce/schema/Case.Id'; 
import Status_FIELD from '@salesforce/schema/Case.Status';

/*import Type__c_FIELD from '@salesforce/schema/Config__c.Type__c';
import Amount__c_FIELD from '@salesforce/schema/Config__c.Amount__c';
import isAssigned__c_FIELD from '@salesforce/schema/Config__c.isAssigned__c';  */





const COLS = [
    { label: 'Label', fieldName: 'Label__c', type: 'Text', sortable: true },
    { label: 'Type', fieldName: 'Type__c',  type: 'Text', sortable: true},
    { label: 'Amount', fieldName: 'Amount__c',  type: 'Number', sortable: true },
   // {  label: 'AssignedState', fieldName: 'isAssigned__c', type: 'Checkbox',editable: true  } //1.label kudukanum
];

export default class CaseConfigsComponent extends LightningElement {

    @api caseid;
    selectedRecords;
    jsonPayload;
    caseStatus;
    disableSend;
   

    //@api assignedConfig;
    columns = COLS;
    draftValues = [];
    configAssigned;

    //properties for using in sort method
    @track sortBy='Amount__c';
    @track sortDirection='asc';


    connectedCallback(){
        console.log('I am in the connectedCallback');
        this.retrieveDetails();
        this.retrievestatusDetails();
       
    }

     //to retrieve all the case configs assigned to the case
    @api retrieveDetails(){
        refreshApex(retrivecaseConfig({caseId:this.caseid, field : this.sortBy,sortOrder : this.sortDirection})  
        .then(result=>{          
         this.configAssigned=result;
         console.log('the this.configAssigned value is '+JSON.stringify(this.configAssigned));
         refreshApex(this.configAssigned);        
         console.log('the this.configAssigned value is '+JSON.stringify(this.configAssigned));   
      
     })  
     .catch(error=>{  
       alert('Cloud not update'+JSON.stringify(error));  
     }) ) 
    }


    //to check the status of the case and to check whether the payload to external service has been sent to not
    retrievestatusDetails(){
      refreshApex(retrivecaseStatus({caseId:this.caseid})  
      .then(result=>{  
       console.log('I am in the retrivecaseStatus'+JSON.stringify(result) );
       this.caseStatus=result.Status;  
       this.disableSend=result.isPayloadSent__c;
       console.log('the case status is: '+this.caseStatus);  
       console.log('the payload sent  is: '+this.disableSend);  

       //To dispatch the event to disable the Add button if the payload is already sent to external service
       const disableAdd = new CustomEvent("buttonvaluechange", {
        detail: this.disableSend
      });  
      // Dispatches the event.
      this.dispatchEvent(disableAdd);
   })  
   .catch(error=>{  
     alert('Cloud not update'+JSON.stringify(error));  
   }) ) 
  }


  //On click of sort, the below event will be triggered
  handleSortdata(event) {
    console.log('I am in sorting method');
    // field name
    this.sortBy = event.detail.fieldName;

    // sort direction
    this.sortDirection = event.detail.sortDirection;

    this.retrieveDetails();
    // calling sortdata function to sort the data based on direction and selected field
   // this.sortData(event.detail.fieldName, event.detail.sortDirection);
}


    //on click of save button, this event will be triggered
    handleSave(){
      this.retrievestatusDetails();

    if(this.caseStatus=='Closed'  && this.disableSend==false){
        callExternalService({caseId:this.caseid})  
        .then(result=>{  
          console.log(result);
          this.disableSend=result;

          //To dispatch the event to disable the Add button if the payload is sent to external service
          const disableAdd = new CustomEvent("buttonvaluechange", {
            detail: this.disableSend
          });  
          // Dispatches the event.
          this.dispatchEvent(disableAdd);

          //If there is errors while sending data to external service
          if(result==false){
            const evt = new ShowToastEvent({
              title: 'Error',
              message: 'Error exception from  External system. Kindly contact System Administrator',
              variant: 'error',
          });
          this.dispatchEvent(evt);
          }
      
          })  
        .catch(error=>{  
           alert('Cloud not update'+JSON.stringify(error));  
           }) 
          }
      else{
            const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Kindly change the Case status to "Closed" to send the Config',
            variant: 'error',
            });
            this.dispatchEvent(evt);
            }

  } 
    
}
