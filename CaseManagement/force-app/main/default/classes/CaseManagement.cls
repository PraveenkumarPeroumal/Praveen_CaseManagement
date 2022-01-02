public class CaseManagement {
    
    //To retrieve all the available configs
    @AuraEnabled(cacheable=true) 
    public static list<Config__c> retriveConfig(String field, String sortOrder) {
        String query;
        query  = 'SELECT Id,Label__c,Type__c, Amount__c,isAssigned__c  FROM Config__c where isAssigned__c=false';
        if(field != null && sortOrder !=null){
            query += ' ORDER BY '+field+' '+sortOrder;
        }
        return Database.query(query);
    }
    
    //To update the config which is added to the case and to create a new  Case_Config__c for the same
    @AuraEnabled  
    public static String updateconfig(String caseId, List<Config__c> configfromLWC){ 
        String response = 'success';
        system.debug('the value coming from LWC is :'+configfromLWC);
        List<Config__c> configList = new  List<Config__c>();
        List<Case_Config__c> caseConfigList = new  List<Case_Config__c>();
        for(Config__c con : configfromLWC){
            Config__c config = new Config__c();
            config.id=con.id;
            config.isAssigned__c=true;
            configList.add(config);  
            
            Case_Config__c caseconfig = new Case_Config__c();
            caseconfig.Label__c=con.Label__c;
            caseconfig.Type__c=con.Type__c;
            caseconfig.Amount__c=con.Amount__c;
            caseconfig.Case__c=caseId;
            caseConfigList.add(caseconfig);             
        }
        
        update configList; 
        insert caseConfigList;        
        return response;
        
    } 
    
    //To query the Case_Config__c which is assigned to the particular case
    @AuraEnabled
    public static list<Case_Config__c> retrivecaseConfig(string caseId,String field, String sortOrder) {
        String query;
        query  = 'SELECT Id,Label__c,Type__c, Amount__c,Case__c FROM Case_Config__c WHERE Case__c =\''+ caseId+'\'' ;
        //query += caseId;
        if(field != null && sortOrder !=null){
            query += ' ORDER BY '+field+' '+sortOrder;
        }system.debug( Database.query(query));
        return Database.query(query);
        /* List<Case_Config__c> conList= [SELECT Id,Label__c,Type__c, Amount__c,Case__c FROM Case_Config__c where Case__c=:caseId];
system.debug(conList);
return conList; */
        
    }
    
    //To find the status of the case record
    @AuraEnabled
    public static Case retrivecaseStatus(string caseId) {
        Case info = [SELECT Id,status,isPayloadSent__c FROM Case where id=:caseId];
        system.debug(info);
        return info;
        
    }  
    
    //To pass the data to external service
      @AuraEnabled
    public static Boolean callExternalService(string caseId) {
        String jsonData; 
        List<Case_Config__c> conList= [SELECT Id,Label__c,Type__c, Amount__c,Case__c FROM Case_Config__c where Case__c=:caseId];
        if(!conList.isEmpty()){
            JSONGenerator jsonGen = JSON.createGenerator(true);
            jsonGen.writeStartObject();
            jsonGen.writeStringField('caseId',caseId);
            jsonGen.writeStringField('status','Closed');
            jsonGen.writeFieldName('caseConfigs');
            jsonGen.writeStartArray();
            for(Case_Config__c con : conList){
                jsonGen.writeStartObject();
                // jsonGen.writeStringField('ID',con.Id);
                jsonGen.writeStringField('label',con.Label__c);
                jsonGen.writeStringField('type',con.Type__c);
                jsonGen.writeNumberField('amount',con.Amount__c);
                jsonGen.writeEndObject();
            }
            jsonGen.writeEndArray();
            jsonGen.writeEndObject();
            jsonData = jsonGen.getAsString();
            System.debug('Json Data - ' + jsonData);
        }
        
        String endpoint = 'https://pravensample.requestcatcher.com/test';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setbody(jsonData);
        Http http = new Http();
        HttpResponse response = http.send(req); 
           
        
        system.debug('the response is '+response);
        system.debug('the response is '+response.getStatusCode());
        
        if(response.getStatusCode()==200){
            system.debug('I am in http response');
            Case caseInfo = new Case();
            caseInfo.id=caseId;
            caseInfo.isPayloadSent__c=true;
            update caseInfo;
            return  caseInfo.isPayloadSent__c;
        }else{
            return false;
        }
        
    }
    
    
    
}