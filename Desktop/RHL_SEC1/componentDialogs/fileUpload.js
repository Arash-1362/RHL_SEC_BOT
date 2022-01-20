
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

class FileUpload extends ComponentDialog { //  Reuseable  dialoge component 
    
    constructor(conservsationState,userState) {
        super('fileUpload');

        

            this.addDialog(new TextPrompt(TEXT_PROMPT));
            this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
            this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
            this.addDialog(new NumberPrompt(NUMBER_PROMPT,this.noOfParticipantsValidator));
            this.addDialog(new DateTimePrompt(DATETIME_PROMPT));



    this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [  

        this.firstStep.bind(this),  // Ask confirmation if user wants to use the service?
       
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
            var msg = ` You have entered following values: \n: ${entitie.attachments}`
            await step.context.sendActivity(msg);
            r
            return new Promise((resolve, reject) => { // Resualt of safe or unsafe URL submitted by user will be shown by calling Adabtive cards
              console.log("inside the pathhhhhhhhhhh   "+localFileName)
  
                  const nvt = require('node-virustotal');
                  const defaultTimedInstance = nvt.makeAPI().setKey('5d0b82b762587006ac0c6bb4197101c8df992dfd08fac4ecaf31b047aa76e866');
                  const aMaliciousFile = require('fs').readFileSync(localFileName);
                  const hashed = nvt.sha256(aMaliciousFile);
                  // const theSameObject1 = defaultTimedInstance.fileLookup(hashed, function(err, res){
                  const theSameObject = defaultTimedInstance.uploadFile(aMaliciousFile,  attachment.name, 'application/x-msdownload', function(err, res){
                  var road = JSON.parse(res);
                   console.log("okkkkkkkkkk"+  hashed )
                  const SameObject = defaultTimedInstance.fileLookup( hashed, function(err, res){
                      var road = JSON.parse(res);
  
      
                          if (road.data.attributes.last_analysis_results.Kaspersky.result != "clean") {
                             
                              // endDialog = true;
                              // resolve(endDialog) ;
                          
                              con.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [0])]});
  
                              
                          }
                          else{
          
                              // endDialog = true;
                              // resolve(endDialog) ;
                          
                              this.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [1])]});
                            
                          }
                      });
  
                      }); 
                 
                
          
              })
        
        
        }else{
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        endDialog = false;
        return await step.prompt(CONFIRM_PROMPT, 'Would you like to use a service ', ['yes', 'no']);
        
        
        }
        
        
        }
        







}

module.exports.FileUpload = FileUpload;









