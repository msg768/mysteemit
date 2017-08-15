window.onload = function () {
   var link = 'https://rawgit.com/msg768/mysteemit/master/';
   if (!window.location.href.startsWith(link)) {
      //window.location.href = link+app+'.html';
   } else {
      if (app == 'raffle') {
         start();
      }
   }

   //steem.config.set('websocket', 'wss://steemd.steemit.com');
   //steem.config.set('websocket', 'wss://steemd.steemitdev.com');
   //steem.config.set('websocket', 'wss://gtg.steem.house:8090');
   //steem.config.set('websocket', 'wss://seed.bitcoiner.me');
   //steem.config.set('websocket', 'wss://this.piston.rocks');
   //steem.config.set('websocket', 'wss://node.steem.ws');
}

Number.prototype.zeroPad = function (length) {
   length = length || 2; // defaults to 2 if no parameter is passed
   return (new Array(length).join('0') + this).slice(length * -1);
};

Date.prototype.getUTCTime = function () {
   return this.getTime() + (this.getTimezoneOffset() * 60000);
};

Date.prototype.getUTCString = function () {
   return this.getUTCFullYear() + '-' + (this.getUTCMonth() + 1).zeroPad(2) + '-' + (this.getUTCDate()).zeroPad(2) + 'T' + (this.getUTCHours()).zeroPad(2) + ':' + (this.getUTCMinutes()).zeroPad(2) + ':' + (this.getUTCSeconds()).zeroPad(2);
};

Date.prototype.getSteemString = function () {
   return this.getFullYear() + '-' + (this.getMonth() + 1).zeroPad(2) + '-' + (this.getDate()).zeroPad(2) + 'T' + (this.getHours()).zeroPad(2) + ':' + (this.getMinutes()).zeroPad(2) + ':' + (this.getSeconds()).zeroPad(2);
};

function customRand(seed) {
   var x = Math.sin(seed) * 10000;
   return x - Math.floor(x);
}
