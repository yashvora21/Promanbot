var restHelper = require('./restAPIHelper.js');
var mock = require('./mock.js');
var moment = require('moment');

module.exports.handleOpenCard = function(response,convo){
  convo.ask('What is the card name?',[
    {
      pattern: '.*',
      callback:function(response,convo){
        
        cardName = response.text;
        restHelper.openCard(response.user, cardName, convo, fetchCardHandler);
        convo.next();
      }
    }
  ])
  convo.next();
}

//User-bot interaction to fetch Card info and then display the operations available to the user for this card

var fetchCardHandler=function(convo, cardName, cardList){
    var count = cardList.length;
    for(var i=0;i<count;i++){
        if(cardName == cardList[i].name){
          convo.say("Here is the card "+cardName+" with description : "+cardList[i].desc);
          convo.ask("What do you want to do ? Below are the available options:\n1) Add todo item\n2) Mark a todo item\n3) Remove a todo item\n4) List checklist items",[
              {
                  pattern: /Add todo item/i,
                  callback: getAddChecklistItemHandler(cardList[i].idChecklists)// Function to handle 'add checklist item'
              },
              {
                  pattern: /List checklist items/i,
                  callback: getListChecklistItemsHandler(cardName,cardList[i].idChecklists)// Function to handle 'list checklist items'
              },
              {
                  pattern: /Mark a todo item/i,
                  callback: getMarkChecklistItemHandler(cardList[i].id, cardList[i].idChecklists)// Function to handle 'mark a checklist item of a card'
              },
              {
                  pattern: /Remove a todo item/i,
                  callback: getRemoveChecklistItemHandler(cardList[i].idChecklists)// Function to handle 'remove checklist item'
              },
              {
                  pattern: '.*',
                  callback: function(response,convo){
                      convo.say("ERROR occurred while selecting the option available for checklist items of a card.");
                      convo.ask("Type the operation to be performed EXACTLY as it appears in the above given options.",[
                        {
                            pattern: /Add todo item/i,
                            callback: getAddChecklistItemHandler(cardList[i].idChecklists)// Function to handle 'add checklist item'
                        },
                        {
                            pattern: /List checklist items/i,
                            callback: getListChecklistItemsHandler(cardName,cardList[i].idChecklists)// Function to handle 'list checklist items'
                        },
                        {
                            pattern: /Mark a todo item/i,
                            callback: getMarkChecklistItemHandler(cardList[i].id, cardList[i].idChecklists)// Function to handle 'mark a checklist item of a card'
                        },
                        {
                            pattern: /Remove a todo item/i,
                            callback: getRemoveChecklistItemHandler(cardList[i].idChecklists)// Function to handle 'remove checklist item'
                        },
                        {
                            pattern: '.*',
                            callback: function(response,convo){
                                convo.say("Sorry, the operation specified by you didn't match any of the above given options");
                                convo.next();   
                            }
                        }   
                      ]);
                      convo.next();
                  }
              }
          ]);
          convo.next();
          return;
        }
    }
    convo.say("I couldn't find the card name '"+cardName+"' in your storyboard");
}

//User-bot interaction to add a checklist item in a card

function getAddChecklistItemHandler(ChecklistID){
    var temp = function(response,convo){
        
        convo.ask("Enter the name of the checklist item you want to add: ",[
            {
                pattern:".*",
                callback:AddChecklistItem(ChecklistID)
            }
        ]);
        convo.next();

    }
    return temp;
}

//User-bot interaction to list all checklist items present in a card

function getListChecklistItemsHandler(cardName, checkListID){
  var listChecklistItems = function(response, convo){
    restHelper.getListCheckListItems(response.user, checkListID,function(err, result, body)  {
      if (err) {
          convo.say(err);
      } else {
          convo.say(body);
      }
      convo.next();
    });
  };
  return listChecklistItems;
}

//User-bot interaction to mark a checklist item of a card

function getMarkChecklistItemHandler(cardID, ChecklistID){
    var temp = function(response,convo){
        convo.ask("Enter the name of the checklist item you want to mark: ",[
            {
                pattern: ".*",
                callback: markChecklistItem(cardID, ChecklistID)
            }
        ]);
        convo.next();
    }
    return temp;
}

//User-bot interaction to remove a checklist item of a card

function getRemoveChecklistItemHandler(ChecklistID){
    var temp = function(response,convo){
        convo.ask("Enter the name of the checklist item you want to delete: ",[
            {
                pattern: ".*",
                callback:RemoveChecklistItem(ChecklistID)
            }
        ]);
        convo.next();
    }
    return temp;
}

//Bot interaction with the user regarding addition of the new checklist item in a card

function AddChecklistItem(ChecklistID){
    var temp = function(response,convo){
        
        var ChecklistItemName = response.text;
        var sendFeedback = function(done){
            if (done == true){
                convo.say("I have added the checklist item "+ ChecklistItemName);
            }
            else{
                convo.say("ERROR occurred while adding the checklist item "+ ChecklistItemName + ". Please try again.");
            }    
            
        }
        restHelper.addTodoItem(response.user, ChecklistID, ChecklistItemName, sendFeedback);
        convo.next();
    }
    return temp;
}

//Bot interaction with the user regarding marking of the specified checklist item of a card

function markChecklistItem(cardID, ChecklistID){
    var temp = function(response,convo){
        var findItem = 0; 
        var ChecklistItemName = response.text;

        var checklistItems = [] ;
        restHelper.getListCheckListItems(response.user, ChecklistID, function(e,r,b){
            checklistItems  = JSON.parse(b);

            for(var i=0;i<checklistItems.length;i++){
                if(ChecklistItemName == checklistItems[i].name){
                    findItem = 1;
                    var sendFeedback = function(done){
                        if(done == true){
                            convo.say("I have marked the checklist item "+ ChecklistItemName);
                        }
                        else{
                            convo.say("ERROR occurred while marking the checklist item "+ ChecklistItemName + ". Please try again.");
                        }    
                    }
                    restHelper.markListItem(response.user, cardID, checklistItems[i].id, sendFeedback);
                } 
            }
            //When checklist Item to be marked is not found
            if(findItem == 0){
                convo.say("Item "+ ChecklistItemName + " is not present. Verify that you have entered the correct item name and also verify that the checklist item is present in the specified card.");
            }
            convo.next();
        });  
    };
    return temp;    
}


//Bot interaction with the user regarding removal of the specified checklist item from the card

function RemoveChecklistItem(ChecklistID){
    var temp = function(response,convo){
        var findItem = 0; 
        var ChecklistItemName = response.text;

        var checklistItems = [] ;
        restHelper.getListCheckListItems(response.user, ChecklistID, function(e,r,b){
            checklistItems  = JSON.parse(b);

            for(var i=0;i<checklistItems.length;i++){
                if(ChecklistItemName == checklistItems[i].name){
                    findItem = 1;
                    var sendFeedback = function(done){
                        if(done == true){
                            convo.say("I have deleted the checklist item "+ ChecklistItemName);
                        }
                        else{
                            convo.say("ERROR occurred while deleting the checklist item "+ ChecklistItemName + ". Please try again.");
                        }        
                    }
                    restHelper.removeChecklistitem(response.user, ChecklistID, checklistItems[i].id, sendFeedback);
                } 
            }
            //When checklist Item to be removed is not found
            if(findItem == 0){
                convo.say("Item "+ ChecklistItemName + " is not present. Verify that you have entered the correct item name and also verify that the checklist item is present in the specified card.");
            }
            convo.next();
        });  
    };
    return temp;
}

// method to call rest api to get cards for weekly summary
module.exports.getCardsForWeeklySummary = function(response,convo){

  // start of the week is Monday and end of the week is Sunday.
  var startOfWeek = moment().startOf('isoWeek').format("MM/DD/YYYY");
  var endOfWeek   = moment().endOf('isoweek').format("MM/DD/YYYY");
  //console.log(startOfWeek);
  //console.log(endOfWeek);
  convo.ask('Creating weekly summary from '+startOfWeek+' to '+endOfWeek+' , would you like to change dates?',[
    {
      pattern: /no/i,
      callback:function(response,convo){
        
        cardName = response.text;
        // rest api handler
        restHelper.openCard(response.user, "", convo, generateCardSummary(startOfWeek, endOfWeek));
        convo.next();
      }
    },
    {
      pattern: ".*",
      callback:function(response,convo){
        
        // parse dates from response
        var res = response.text.match(/\d{2}(\D)\d{2}\1\d{4}/g);
        // rest api handler
        restHelper.openCard(response.user, "", convo, generateCardSummary(res[0], res[1]));
        convo.next();
      }
    }
  ])
  convo.next();
  
}


function generateCardSummary(startDate, endDate){
  var parseCardsAndCreateSummary = function(convo, cardName, cardList){
    var dueCards = [];
    var completedCards = [];

    for(var i=0;i<cardList.length;i++){
          var isValid = moment(cardList[i].due,["MM-DD-YYYY"]).isBetween(startDate, endDate);
          if(isValid){
            if(cardList[i].dueComplete == true){
              completedCards.push(cardList[i]);
            }
            else{
              dueCards.push(cardList[i]);
            }
          }
    }
    if(dueCards.length > 0 || completedCards.length > 0){
      convo.say("Here is the list of completed cards");
      convo.say("Completed cards : ");
      for(var i=0;i<completedCards.length;i++){
        convo.say(completedCards[i].name+" | "+completedCards[i].desc+" | "+completedCards[i].due);
      }
      convo.say("Due cards : ");
      for(var j=0;j<dueCards.length;j++){
        convo.say(dueCards[j].name+" | "+dueCards[j].desc+" | "+dueCards[j].due);
      }
    }
    else {
      convo.say("No cards found for the given date range!");
    }
  }
  return parseCardsAndCreateSummary;
}

// method to handle conversation regarding notification to user about a card
module.exports.handleNotifyUser = function(response,convo){
    getNotifyCardInput(response,convo);
}

function getNotifyCardInput(response,convo){
    convo.ask("Can you provide the card name?",[
        {
            pattern: '.*',
            callback:getNotifyMemo
        }
    ]);
    convo.next();
}

function getNotifyMemo(response,convo){
    var cardName = response.text;
    
    restHelper.openCard(response.user, cardName, convo, getCardNotifyMessage);
}

function getCardNotifyMessage(convo, cardName, cardList){
    var count = cardList.length;
    for(var i=0;i<count;i++){
        if(cardName == cardList[i].name){
          convo.say("Here is the card "+cardName+" with description : "+cardList[i].desc);
          convo.ask("Enter the message",[
              {
                  pattern: ".*",
                  callback: getCardCommentHandler(cardList[i].id)// Function to handle add todo item
              }
          ]);
          convo.next()
          return;
        }
    }
    convo.say("I couldn't find the card name '"+cardName+"' in your storyboard");
    convo.next();
}

function getCardCommentHandler(cardID){
    var temp = function(response,convo){
        var message = response.text;
        message = "@card "+message;
        
        var sendFeedback = function(done){
            if(!done){
                convo.say("I'm sorry as I wasn't able to send your notification.");
            }else{
                convo.say("I have sent your message to all members of this card.");
            }
            convo.next();
        }

        sendFeedback(true);
        restHelper.addCommentOnCard(response.user,cardID,message,sendFeedback);
    }
    return temp;
}
