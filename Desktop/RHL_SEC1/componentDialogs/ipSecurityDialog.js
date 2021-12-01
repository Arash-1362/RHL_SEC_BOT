const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');

const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
const NUMBER_PROMPT    = 'NUMBER_PROMPT';
const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';
var resultOfScan;
var UrlToBeScaned;



class IPSecurityDialog extends ComponentDialog { // Reuseable  dialoge component 
    
    constructor(conservsationState,userState) {
        super('cancelSecurityDialog');

        

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));



this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [  

    this.firstStep.bind(this),  // Ask confirmation if user wants to use the service?
    this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to make reservation
    this.summaryStep.bind(this),  //Show summary of values entered by user and ask confirmation to make reservation
]));

    this.initialDialogId = WATERFALL_DIALOG;


   }

   async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
        await dialogContext.beginDialog(this.id);
    }
}

async firstStep(step) {
endDialog = false;
// Running a prompt here means the next WaterfallStep will be run when the users response is received.
return await step.prompt(CONFIRM_PROMPT, 'Would you like to use a service ', ['yes', 'no']);
      
}




async confirmStep(step){

    step.values.name = step.result
    IPtoBeScaned = step.values.name
    var msg = ` You have entered following values: \n Name: ${step.values.name}`

    await step.context.sendActivity(msg);

    return await step.prompt(CONFIRM_PROMPT, 'Are you sure IP is correct and you want to go ahead?', ['yes', 'no']);
}




 summaryStep(step){


    if(step.result===true)
    {
        const nvt = require('node-virustotal');
        const defaultTimedInstance = nvt.makeAPI().setKey('5d0b82b762587006ac0c6bb4197101c8df992dfd08fac4ecaf31b047aa76e866');
        const theSameObject = defaultTimedInstance.ipLookup(  IPtoBeScaned, function(err, res){
       var road = JSON.parse(res);
        if (road.data.attributes.last_analysis_results.Kaspersky.result != "clean") {
            console.log("It is not clean");
        }
        else{
            console.log("The IP is safe");
        }
    });
    
    
    
    }
    


      

    endDialog = true;
    return  step.endDialog(); 


}






async isDialogComplete(){
    return endDialog;
}
}

module.exports.IPSecurityDialog= IPSecurityDialog;










