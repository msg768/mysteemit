var app = 'register';
var barId = null;

steem.api.setOptions({ url: 'https://api.steemit.com' });

function checkNewAccountName() {
   var newAccountName = document.getElementById('newAccountName').value;
   steem.api.getAccounts([newAccountName], function (err, result) {
      if (result.length == 1) {
         var errorMessage = 'Not available!';
         document.getElementById('newAccountName_err').innerHTML = errorMessage;
         return false;
      } else {
         var newAccountName = document.getElementById('newAccountName').value;
         if (steem.utils.validateAccountName(newAccountName) != null) {
            var errorMessage = 'Not valid!';
            var details = steem.utils.validateAccountName(newAccountName);
            document.getElementById('newAccountName_err').innerHTML = errorMessage;
            document.getElementById('error').innerHTML = details;
            return false;
         } else {
            document.getElementById('newAccountName_err').innerHTML = '';
            document.getElementById('error').innerHTML = '';
            return true;
         }
      }
   });
}

function checkCurrentAccountName() {
   var currentAccountName = document.getElementById('currentAccountName').value;
   steem.api.getAccounts([currentAccountName], function (err, result) {
      if (result.length == 0) {
         var errorMessage = 'Not available!';
         document.getElementById('currentAccountName_err').innerHTML = errorMessage;
         return false;
      } else {
         if (parseFloat(result[0].balance) < 8) {
            var errorMessage = 'Not enough STEEM!';
            document.getElementById('currentAccountName_err').innerHTML = errorMessage;
            return false;
         } else {
            document.getElementById('currentAccountName_err').innerHTML = '';
            return true;
         }
      }
   });
}

function checkActiveKey() {
   var activeKey = document.getElementById('activeKey').value;
   var errorMessage = '';
   document.getElementById('activeKey_err').innerHTML = errorMessage;

   if (!steem.auth.isWif(activeKey)) {
      var errorMessage = 'False key!';
      document.getElementById('activeKey_err').innerHTML = errorMessage;
   } else {
      var currentAccountName = document.getElementById('currentAccountName').value;
      steem.api.getAccounts([currentAccountName], function (err, result) {
         if (result.length > 0) {
            var activeKey = document.getElementById('activeKey').value;
            var publicKey = result[0].active.key_auths[0][0];
            if (!steem.auth.wifIsValid(activeKey, publicKey)) {
               var errorMessage = 'Wrong key!';
               document.getElementById('activeKey_err').innerHTML = errorMessage;
            }
         }
      });
   }
}

function checkPassword() {
   var newAccountPassword = document.getElementById('newAccountPassword').value;
   if (newAccountPassword == '') {
      var errorMessage = 'Choose a password!';
      document.getElementById('newAccountPassword_err').innerHTML = errorMessage;
   } else {
      if (newAccountPassword.length < 31) {
         var errorMessage = 'Too short!';
         document.getElementById('newAccountPassword_err').innerHTML = errorMessage;
      } else {
         document.getElementById('newAccountPassword_err').innerHTML = '';
      }
   }
}

function generateNewPassword() {
   document.getElementById('newAccountPassword').value = (steem.formatter.createSuggestedPassword() + steem.formatter.createSuggestedPassword()).substring(28);
}

function validate() {
   checkNewAccountName();
   checkActiveKey();
   checkCurrentAccountName();
   checkPassword();

   if (document.getElementById('currentAccountName_err').innerHTML != '') return false;
   if (document.getElementById('activeKey_err').innerHTML != '') return false;
   if (document.getElementById('newAccountName_err').innerHTML != '') return false;
   if (document.getElementById('newAccountPassword_err').innerHTML != '') return false;

   return true;
}

function createNewAccount() {
   var newAccountName = document.getElementById('newAccountName').value;
   var pwd = document.getElementById('newAccountPassword').value;
   var newOwnerKey = steem.auth.toWif(newAccountName, pwd, 'owner');
   newOwnerKey = steem.auth.wifToPublic(newOwnerKey);
   var newActiveKey = steem.auth.toWif(newAccountName, pwd, 'active');
   newActiveKey = steem.auth.wifToPublic(newActiveKey);
   var newPostingKey = steem.auth.toWif(newAccountName, pwd, 'posting');
   newPostingKey = steem.auth.wifToPublic(newPostingKey);
   var newMemoKey = steem.auth.toWif(newAccountName, pwd, 'memo');
   newMemoKey = steem.auth.wifToPublic(newMemoKey);
   var jsonMetadata = '';

   var creator = document.getElementById('currentAccountName').value;
   var creatorWif = document.getElementById('activeKey').value;
   var fee = '3.000 STEEM';

   var owner = new Object();
   owner.weight_threshold = 1;
   owner.account_auths = [];
   owner.key_auths = new Array();
   owner.key_auths[0] = new Array();
   owner.key_auths[0][0] = newOwnerKey;
   owner.key_auths[0][1] = 1;

   var active = new Object();
   active.weight_threshold = 1;
   active.account_auths = [];
   active.key_auths = new Array();
   active.key_auths[0] = new Array();
   active.key_auths[0][0] = newActiveKey;
   active.key_auths[0][1] = 1;

   var posting = new Object();
   posting.weight_threshold = 1;
   posting.account_auths = [];
   posting.key_auths = new Array();
   posting.key_auths[0] = new Array();
   posting.key_auths[0][0] = newPostingKey;
   posting.key_auths[0][1] = 1;

   steem.broadcast.accountCreate(creatorWif, fee, creator, newAccountName, owner, active, posting, newMemoKey, jsonMetadata, function (err, result) {
      document.getElementById('bar').innerHTML = '';
      window.clearInterval(barId);
      if (err != null) {
         console.log(err);
         document.getElementById('error').innerHTML = 'Failed! To find out why, open the console.';
         enableAll();
      } else {
         steem.broadcast.transfer(creatorWif, creator, 'msg768', '1.000 STEEM', 'REGISTER@github - ' + newAccountName, function (e, r) {
            if (e != null) {
               console.log(e);
               document.getElementById('error').innerHTML = 'Transferring 1.000 STEEM to @msg768 failed, but your account was created successfully. Would you be kind enough to contact @msg768 on steemit.chat about this? Thank you! :]';
            }

            document.getElementById('status').innerHTML = 'DONE!';
         });
      }
   });
}

function disableAll() {
   document.getElementById('error').innerHTML = '';
   document.getElementById('currentAccountName').disabled = true;
   document.getElementById('activeKey').disabled = true;
   document.getElementById('newAccountName').disabled = true;
   document.getElementById('register').disabled = true;
   document.getElementById('status').innerHTML = 'Processing';
   barId = window.setInterval(animateProcess, 100);
}

function animateProcess() {
   var status = document.getElementById('bar').innerHTML;
   if (status.length == 3) {
      status = '.';
   } else {
      status += '.';
   }

   document.getElementById('bar').innerHTML = status;
}

function enableAll() {
   document.getElementById('currentAccountName').disabled = false;
   document.getElementById('activeKey').disabled = false;
   document.getElementById('newAccountName').disabled = false;
   document.getElementById('register').disabled = false;
}

function register() {
   if (validate()) {
      var response = confirm('Have you saved your username and password? If registration succeeds and you lose your username and/or password, I cannot recover them for you!');
      if (response) {
         disableAll();
         createNewAccount();
      }
   }
}

function toggleReadMe() {
   var visible = document.getElementById('readMe').style.display;
   if (visible == 'none') {
      document.getElementById('readMe').style.display = 'inline';
   } else {
      document.getElementById('readMe').style.display = 'none';
   }
}
