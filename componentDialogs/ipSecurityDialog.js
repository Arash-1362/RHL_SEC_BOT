//Autor : ARASH DOUST 
//template is used from https://github.com/microsoft/BotBuilder-Samples

const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');
const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const {CardFactory} = require('botbuilder');

//importing card factory class
const safeResault = require('./resources/adaptiveCard/safeResault')
const unSafeResault = require('./resources/adaptiveCard/unSafeResault')


const CARDS = [

    safeResault,
    unSafeResault
    
];





const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
const NUMBER_PROMPT    = 'NUMBER_PROMPT';
const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';
var resultOfScan;
var entitie;
var IPtoBeScaned;




class IPSecurityDialog extends ComponentDialog { // Reuseable  dialoge component 
    
    constructor(conservsationState,userState) {
        super('ipSecurityDialog');

        

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));



this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [  

    this.firstStep.bind(this),  // Ask confirmation if user wants to use the service?
    this.getName.bind(this),    // Get name of URL
    this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation 
    this.summaryStep.bind(this),  //Show summary of values entered by user and ask confirmation 
]));

    this.initialDialogId = WATERFALL_DIALOG;


   }

  
   async run(turnContext, accessor ,entities) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    entitie = entities
    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
        await dialogContext.beginDialog(this.id, entities);
    }
}


async firstStep(step) {
    if(entitie !== undefined){
        var msg = ` You have entered following : \n: ${entitie}`
        await step.context.sendActivity(msg);
        return new Promise((resolve, reject) => { // Resualt of safe or unsafe URL submitted by user will be shown by calling Adabtive cards
     
                    IPtoBeScaned = entitie;
                    const nvt = require('node-virustotal');// Resualt of safe or unsafe IP submitted by user will be shown by calling Adabtive cards(to be implemented)
                    const defaultTimedInstance = nvt.makeAPI().setKey('5d0b82b762587006ac0c6bb4197101c8df992dfd08fac4ecaf31b047aa76e866');
                    const theSameObject = defaultTimedInstance.ipLookup( IPtoBeScaned, function(err, res){
                    var road = JSON.parse(res);
        
                    if (road.data.attributes.last_analysis_results.Kaspersky.result != "clean") {
                       
                        endDialog = true;
                        resolve(endDialog) ;
                    
                        step.context.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [1])]});
                        
                    }
                    else{
    
                        endDialog = true;
                        resolve(endDialog) ;
                    
                        step.context.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [0])]});
                      
                    }
                   
                }); 
            
    
          
    
        })
    
    
    }else{
    // Running a prompt here means the next WaterfallStep will be run when the users response is received.
    endDialog = false;
    return await step.prompt(CONFIRM_PROMPT, 'Would you like to use a service ', ['yes', 'no']);
    
    
    }
    
    
    }
    



async getName(step){ //Prompt user to enter the IP to be scaned 
     
    console.log(step.result)

    if(step.result === true)
    { 
    return await step.prompt(TEXT_PROMPT, 'What is the IP you need to scan ?');
    }
    if(step.result === false)
    { 
        await step.context.sendActivity("You chose not to go ahead with Service.");
        endDialog = true;
        return await step.endDialog();   
    }


}


async confirmStep(step){

    step.values.name = step.result
    IPtoBeScaned = step.values.name
    var msg = ` You have entered following values: \n : ${step.values.name}`

    await step.context.sendActivity(msg);

    return await step.prompt(CONFIRM_PROMPT, 'Are you sure IP  is correct and you want to go ahead?', ['yes', 'no']);
}




summaryStep (step){

    return new Promise((resolve, reject) => { // Resualt of safe or unsafe URL submitted by user will be shown by calling Adabtive cards
 
        if(step.result===true)
        {
                
            const nvt = require('node-virustotal');// Resualt of safe or unsafe IP submitted by user will be shown by calling Adabtive cards(to be implemented)
            const defaultTimedInstance = nvt.makeAPI().setKey('5d0b82b762587006ac0c6bb4197101c8df992dfd08fac4ecaf31b047aa76e866');
            const theSameObject = defaultTimedInstance.ipLookup( IPtoBeScaned, function(err, res){
            var road = JSON.parse(res);
    
                if (road.data.attributes.last_analysis_results.Kaspersky.result != "clean") {
                
                    endDialog = true;
                    resolve(endDialog) ;
                    step.context.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [1])]});
                  

                }
                else{
                   
                    endDialog = true;
                    resolve(endDialog) ;
                    step.context.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [0])]});
                  
                             
                }
       
            } ); 
        

        }else{

            step.context.sendActivity("IP is not correct !! try the service agine ...");
            endDialog = true;
            resolve(endDialog) ;
        }
       

    })
 
}





 isDialogComplete(){
    return endDialog;
}
}







module.exports.IPSecurityDialog= IPSecurityDialog;










