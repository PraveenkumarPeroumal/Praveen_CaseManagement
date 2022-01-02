@isTest
public class CaseManagementTest {
    
    public class ExampleCalloutMock implements HttpCalloutMock{
        public HttpResponse respond(HTTPRequest req){
            HttpResponse res = new HttpResponse();
            res.setStatus('OK');
            res.setStatusCode(200);
            res.setBody('Salesforcescool');
            return res;
        }
    }
    
    
    @testSetup
    static void setMethod(){
        List<Config__c> configList = new List<Config__c>(); 
        for(Integer i=0;i<=10;i++){
            Config__c con = new Config__c();  
            con.Label__c= 'Test Label '+i;
            con.Type__c= 'Test Type '+i;
            con.Amount__c=10+i;
            configList.add(con);
        }
        insert configList;
        
        Case c = new Case();
        c.Status='Closed';
        c.isPayloadSent__c=false;
        insert c;
        
        Case_Config__c caseConfig = new Case_Config__c(Label__c='Test Label',
                                                       Type__c='Test Type',
                                                       Amount__c=60,
                                                       Case__c=c.Id
                                                      ); 
        insert caseConfig;
        
    }
    
    @isTest 
    static void retriveConfigTest(){
        
        String caseId = [SELECT Id FROM Case LIMIT 1]?.Id;
        List<Config__c> configList = [SELECT Id,Label__c,Type__c, Amount__c,isAssigned__c  FROM Config__c where isAssigned__c=false];
        
        test.startTest();
        CaseManagement.retriveConfig('Amount__c','asc');
        CaseManagement.updateconfig(caseId,configList);
        List<Case_Config__c> retriveCase =  CaseManagement.retrivecaseConfig(caseId,'Label__c','asc');
        system.assertNotEquals(null, retriveCase);
        Case info =  CaseManagement.retrivecaseStatus(caseId);
        system.assertEquals('Closed', info.Status);
        // Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock());
        //CaseManagement.callExternalService(caseId);
        // system.assertEquals(True,isPayloadSent);
        test.StopTest();
    }   
    
    @isTest 
    static void callExternalServiceTest(){
        String caseId = [SELECT Id FROM Case LIMIT 1]?.Id;
        test.startTest();
        Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock());
        CaseManagement.callExternalService(caseId);
        test.StopTest();
        
    }
    
}