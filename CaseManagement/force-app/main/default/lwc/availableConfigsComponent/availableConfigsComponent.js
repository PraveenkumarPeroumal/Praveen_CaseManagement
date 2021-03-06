import { LightningElement, wire, api, track } from 'lwc';
import retriveConfig from '@salesforce/apex/CaseManagement.retriveConfig';
import updateconfig from '@salesforce/apex/CaseManagement.updateconfig';
import { refreshApex } from '@salesforce/apex';
import { updateRecord } from 'lightning/uiRecordApi';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Label__c_FIELD from '@salesforce/schema/Config__c.Label__c';
import Type__c_FIELD from '@salesforce/schema/Config__c.Type__c';
import Amount__c_FIELD from '@salesforce/schema/Config__c.Amount__c';
import isAssigned__c_FIELD from '@salesforce/schema/Config__c.isAssigned__c';
import ID_FIELD from '@salesforce/schema/Config__c.Id';


const COLS = [
    { label: 'Label', fieldName: 'Label__c', type: 'Text', sortable: true },
    { label: 'Type', fieldName: 'Type__c',  type: 'Text', sortable: true},
    { label: 'Amount', fieldName: 'Amount__c',  type: 'Number', sortable: true },
   // {  label: 'AssignedState', fieldName: 'isAssigned__c', type: 'Checkbox',editable: true  } //1.label kudukanum
];
export default class AvailableConfigsComponent extends LightningElement {
   
    @api recordId;
    wiredAccountList;
    config;
    
    columns = COLS;
    draftValues = [];
    selectedRecords;
    //visibility=false;
    disableAdd;

    //properties for using in sort method,Start
    @track sortBy='Amount__c';
    @track sortDirection='asc';
    //properties for using in sort method,End

    //properties for using in PageNaviagation,Start
    @track page = 1; 
    @track pageSize = 100;  //pageSize specifies in a page how many records need to be displayed? in our case i am making 100 records per page. It can be changed based on our requirements
    @track totalRecountCount = 0;
    @track totalPage = 0;
    @track startingRecord = 1;
    @track endingRecord = 0; 
    //properties for using in PageNaviagation,End
    

    //To get all the available cofig
    @wire(retriveConfig,{field : '$sortBy',sortOrder : '$sortDirection'})
    wiredConfig(result) {
        refreshApex(this.wiredAccountList = result);
        if (result.data) {       
            console.log('i am in the wire method here');
            console.log('the result is :'+JSON.stringify(result.data));
            this.items  = result.data;
            this.totalRecountCount = result.data.length; 
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); 
            
            this.config = this.items.slice(0,this.pageSize); 
            console.log('the config value in wire is: '+JSON.stringify( this.config));
            this.endingRecord = this.pageSize;
            //this.columns = columns;
            refreshApex(this.config);
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            //this.data = undefined;
        }
    }
    

    //on click of the Add button the below event will be called
    handleSave(event) {
        this.selectedRecords =  
       this.template.querySelector("lightning-datatable").getSelectedRows();  
       console.log('I am in the loop');
        console.log('the selected records are: '+JSON.stringify(this.selectedRecords));
        
        updateconfig({caseId:this.recordId,configfromLWC: this.selectedRecords})  
        .then(result=>{  
            console.log('I am in the updateconfig'+result);
           // this.visibility=true;
           //firing an child method
           refreshApex(this.wiredAccountList);  
           //refreshApex(this.items);
            this.template.querySelector("c-case-configs-component").retrieveDetails();
           // return refreshApex(this.config);           
         
        })  
        .catch(error=>{  
          alert('Cloud not update'+JSON.stringify(error));  
        })  
        refreshApex(this.wiredAccountList);
    }

    //the below event comes from caseConfig component. this is to check if the payload to external service has been already sent or not.If sent then we disabling the Add button 
    //because if payload is sent we cannot add the configs to that case    
    hanldeButtonValueChange(event){
        this.disableAdd=event.detail;
    }
      
    //onclick of sorting in fields this method will be called
    handleSortdata(event) {
        // field name
        this.sortBy = event.detail.fieldName;

        // sort direction
        this.sortDirection = event.detail.sortDirection;

        // calling sortdata function to sort the data based on direction and selected field
       // this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }


    //Code for Page Naviagation, Start
     //clicking on previous button this method will be called
     previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //clicking on next button this method will be called
    nextHandler() {
        if((this.page<this.totalPage) && this.page !== this.totalPage){
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);            
        }             
    }

    //this method displays records page by page
    displayRecordPerPage(page){

        this.startingRecord = ((page -1) * this.pageSize) ;
        this.endingRecord = (this.pageSize * page);

        this.endingRecord = (this.endingRecord > this.totalRecountCount) 
                            ? this.totalRecountCount : this.endingRecord; 

        this.config = this.items.slice(this.startingRecord, this.endingRecord);

        this.startingRecord = this.startingRecord + 1;
    }   
    //Code for Page Naviagation, End 



}
