
//template is used from https://github.com/microsoft/BotBuilder-Samples
const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');
const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const {CardFactory} = require('botbuilder');

//importing card factory class
const ResualtCard = require('./resources/adaptiveCard/ResualtCard')
const UnsafeResault = require('./resources/adaptiveCard/Unsafe.json')


const CARDS = [

    ResualtCard,
    UnsafeResault
];



const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
const NUMBER_PROMPT    = 'NUMBER_PROMPT';
const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';
var resultOfScan;
var UrlToBeScaned;


class MakeSecurityDialogs extends ComponentDialog {
    
    constructor(conservsationState,userState) {
        super('makeSecurityDialogs');

        

            this.addDialog(new TextPrompt(TEXT_PROMPT));
            this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
            this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
            this.addDialog(new NumberPrompt(NUMBER_PROMPT,this.noOfParticipantsValidator));
            this.addDialog(new DateTimePrompt(DATETIME_PROMPT));



    this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [  

        this.firstStep.bind(this),  // Ask confirmation if user wants to use the service?
        this.getName.bind(this),    // Get name of URL
        this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to make reservation
        this.summaryStep.bind(this),
        this.firstStep1.bind(this),
    ]));
        this.initialDialogId = WATERFALL_DIALOG;


    }

    async run(turnContext, accessor ,entities) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id, entities);
        }
    }

async firstStep(step) {


// Running a prompt here means the next WaterfallStep will be run when the users response is received.
return await step.prompt(CONFIRM_PROMPT, 'Would you like to use a service ', ['yes', 'no']);
endDialog = false;
// Running a prompt here means the next WaterfallStep will be run when the users response is received.


}



    


async getName(step){
     
    console.log(step.result)

    if(step.result === true)
    { 
    return await step.prompt(TEXT_PROMPT, 'What is the URL you need to scan ?');
    }
    if(step.result === false)
    { 
        await step.context.sendActivity("You chose not to go ahead with Service.");
        endDialog = true;
        return await step.endDialog();   
    }


}

async confirmStep(step){
    // step.value.getName = step.info.options.getName[0];

    step.values.name = step.result
   
    UrlToBeScaned = step.values.name
    var msg = ` You have entered following values: \n: ${step.values.name}`

    await step.context.sendActivity(msg);

    return await step.prompt(CONFIRM_PROMPT, 'Are you sure URL is correct and you want to go ahead?', ['yes', 'no']);
}



summaryStep(step){

    return new Promise((resolve, reject) => {

        if(step.result===true)
        {
            const nvt = require('node-virustotal');
               const defaultTimedInstance = nvt.makeAPI().setKey('5d0b82b762587006ac0c6bb4197101c8df992dfd08fac4ecaf31b047aa76e866');
                const hashed = nvt.sha256( UrlToBeScaned);
                
                const theSameObject = defaultTimedInstance.urlLookup(hashed, function(err, res){
               var road = JSON.parse(res);
    
                if (road.data.attributes.last_analysis_results.Kaspersky.result != "clean") {
                   
            

                    resultOfScan = "The URL is not safe!"

                    step.context.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [1])]});
                    // resolve(resultOfScan);
                    // step.context.sendActivity("Your resualt: "+ resultOfScan);

                    
                }
                else{
                   

                    resultOfScan = "The URL is  safe!"
                    
                    step.context.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [0])]});
                    // reject(resultOfScan);
                  
                }
               
            }); 
        

        }
      
        endDialog = true;
        return step.endDialog(); 

    })
        


}

// summaryStep({result: true})
//     .then((res) => {
//         // successful result
//     }).catch((error) => {
//     // error
//     });









async firstStep1(step) {
    endDialog = false;
    // Running a prompt here means the next WaterfallStep will be run when the users response is received.
    await step.context.sendActivity({
        text: ' resultOfScan',
        attachments: [CardFactory.adaptiveCard(CARDS[0])]
    });
    
    return await step.prompt(TEXT_PROMPT, '');
          
    }
    


// async noOfParticipantsValidator(promptContext) {
//     // This condition is our validation rule. You can also change the value at this point.
//     return promptContext.recognized.succeeded && promptContext.recognized.value > 1 && promptContext.recognized.value < 150;
// }

async isDialogComplete(){
    return endDialog;
}
}

module.exports.MakeSecurityDialogs = MakeSecurityDialogs;










