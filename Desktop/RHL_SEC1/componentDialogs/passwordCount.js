
//template is used from https://github.com/microsoft/BotBuilder-Samples
const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');
const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const {CardFactory} = require('botbuilder');

//importing card factory class
const safeResault = require('./resources/adaptiveCard/safeResault')
const unSafeResault = require('./resources/adaptiveCard/unSafeResault.json')


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
var UrlToBeScaned;
var entitie;
var PassToBeScaned;

class PasswordCount extends ComponentDialog { //  Reuseable  dialoge component 
    
    constructor(conservsationState,userState) {
        super('passwordCount');

        

            this.addDialog(new TextPrompt(TEXT_PROMPT));
            this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
            this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
            this.addDialog(new NumberPrompt(NUMBER_PROMPT,this.noOfParticipantsValidator));
            this.addDialog(new DateTimePrompt(DATETIME_PROMPT));



    this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [  

        this.firstStep.bind(this),  // Ask confirmation if user wants to use the service?
        this.getName.bind(this),    // Get name of URL
        this.confirmStep.bind(this), // Confirm value enterd by the user 
        this.summaryStep.bind(this),
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
    var msg = ` You have entered following values: \n: ${entitie}`
    await step.context.sendActivity(msg);
    return new Promise((resolve, reject) => { // Resualt of safe or unsafe URL submitted by user will be shown by calling Adabtive cards
 
        const https = require('https');
        const crypto = require('crypto');
         
        let hashPassword = crypto.createHash('sha1')
            .update(entitie)
            .digest('hex')
            .toUpperCase();
        let prefix = hashPassword.slice(0, 5);
        let apiCall = `https://api.pwnedpasswords.com/range/${prefix}`;
         
        let hashes = '';
        https.get(apiCall, function (res) {
            res.setEncoding('utf8');
            res.on('data', (chunk) => hashes += chunk);
            res.on('end', onEnd);
        }).on('error', function (err) {
            console.error(`Error: ${err}`);
        });
         
        function onEnd() {
            let res = hashes.split('\r\n').map((h) => {
                let sp = h.split(':');
                return {
                    hash: prefix + sp[0],
                    count: parseInt(sp[1])
                }
            });
         
            let found = res.find((h) => h.hash === hashPassword);
            if (found) {
                step.context.sendActivity({text: "Found " +found.count+ " matches! Password vulnarable!"});
            } else {
                step.context.sendActivity({text: "No matches found!"});

            }
        }
        

      

    })


}else{
// Running a prompt here means the next WaterfallStep will be run when the users response is received.
endDialog = false;
return await step.prompt(CONFIRM_PROMPT, 'Would you like to use a service ', ['yes', 'no']);


}


}



    


async getName(step){ //Prompt user to enter the URL to be scaned 

    console.log(step.result)

    if(step.result === true ) 
    { 
    return await step.prompt(TEXT_PROMPT, 'What is the password you need to scan ?');
    }
    if(step.result === false )
    { 
        await step.context.sendActivity("You chose not to go ahead with Service.");
        endDialog = true;
        return await step.endDialog();   
    }

}

async confirmStep(step){ //Double check the value yser have entered 

    
    step.values.name = step.result
    PassToBeScaned = step.values.name
   
    var msg = ` You have entered following values: \n: ${step.values.name}`

    await step.context.sendActivity(msg);
    return await step.prompt(CONFIRM_PROMPT, 'Are you sure URL is correct and you want to go ahead?', ['yes', 'no']);
}



// the problem is the code after this pronise is not running and this promise is not returning anything 
//Summary of the steps will return the summary and the resualt of the requiest to user 
summaryStep (step){

    return new Promise((resolve, reject) => { // Resualt of safe or unsafe URL submitted by user will be shown by calling Adabtive cards
 
        if(step.result===true)
        {
            const https = require('https');
            const crypto = require('crypto');
             
            let hashPassword = crypto.createHash('sha1')
                .update( PassToBeScaned )
                .digest('hex')
                .toUpperCase();
            let prefix = hashPassword.slice(0, 5);
            let apiCall = `https://api.pwnedpasswords.com/range/${prefix}`;
             
            let hashes = '';
            https.get(apiCall, function (res) {
                res.setEncoding('utf8');
                res.on('data', (chunk) => hashes += chunk);
                res.on('end', onEnd);
            }).on('error', function (err) {
                console.error(`Error: ${err}`);
            });
             
            function onEnd() {
                let res = hashes.split('\r\n').map((h) => {
                    let sp = h.split(':');
                    return {
                        hash: prefix + sp[0],
                        count: parseInt(sp[1])
                    }
                });
             
                let found = res.find((h) => h.hash === hashPassword);
                if (found) {
                    //console.log(`Found ${found.count} matches! Password vulnarable!`);
                    step.context.sendActivity({text: "Found" +found.count+ "matches! Password vulnarable!"});


                } else {
                    //console.log('No matches found!');
                    step.context.sendActivity({text: "No matches found!"});
                }
            }
        }else{

            step.context.sendActivity("value is not correct !! try the service agine ...");
            endDialog = true;
            resolve(endDialog) ;
        }
        
       

    })
 
}





 isDialogComplete(){
    return endDialog;
}
}

module.exports.PasswordCount = PasswordCount;









