module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if(myTimer.isPastDue)
    {
        context.log('JavaScript is running late!');
    }
    context.log('Function trigerred at: ', timeStamp);
    
    CheckResourceHealth(context);

    //context.done();
};

function CheckResourceHealth(context)
{
    var adal = require('adal-node');
    var rest = require('restler');
    const os = require('os');

    var AuthenticationContext = adal.AuthenticationContext;

    var tenantID = process.env.tenantID;
    var clientID = process.env.clientID;
    var resource = process.env.resource;
    var authURL = process.env.authURLBase + process.env.tenantID;
    var secret = process.env.secret;
    var subId = process.env.subId;

    var authcontext = new AuthenticationContext(authURL);
    var authHeader, requestURL;

    var values = [];
    var excludeList = ["SoutheastAsiaPlan", "resourcehealthmon"];

    authcontext.acquireTokenWithClientCredentials(resource, clientID, secret, function (err, tokenResponse) {
        if (err) {
            context.log('Oops, error' + err.stack);
            context.done();
        } else {
            
            authHeader = tokenResponse['accessToken'];

            requestURL = "https://management.azure.com/subscriptions/" + subId + "/providers/Microsoft.ResourceHealth/availabilityStatuses?api-version=2015-01-01";

            rest.get(requestURL, { accessToken: authHeader }).on('complete', function (result) {
                //context.log(JSON.stringify(result, null, 2));
                result.value.forEach(function (resource) {
                    if (resource.properties.availabilityState != "Available") {
                        var arr = resource.id.split("/");
                        var resName, resType, resStatus, resMessage;
                        resName = arr[8];

                        if (excludeList.indexOf(resName) == -1 ) {
                            resType = arr[7];
                            resStatus = resource.properties.availabilityState;
                            resMessage = resource.properties.summary;
                            var resValue = resName + '|' + resType + '|' + resStatus + '|' + resMessage;
                            values.push(resValue);
                        }
                    }
                });
                if(values.length > 0)
                {
                    context.log(values.length);
                    SendEmail(context, values);
                } else {
                    context.log('Health probe did not find any issues with any resources.')
                    context.done();
                }
            });
        };
    });
}

function GetEnvironmentVariable(name)
{
    return name + ": " + process.env[name];
};

function SendEmail(context, statusArray)
{
    var messageBody = '';
    statusArray.forEach(function (resource) {
        var arr = resource.split("|");
        
        var resourceInfo = '<b>' + arr[0] + '(' + arr[1] + ') - ' + arr[2] + '</b> - ' + arr[3] + '<br>'; 
        messageBody = messageBody + resourceInfo;
    });

    //context.log(messageBody);

    var helper = require('sendgrid').mail;
    var from_email = new helper.Email('<YOUR EMAIL ID>');
    var to_email = new helper.Email('<RECIPIENT EMAIL ID>');
    var subject = 'Azure Resource Health notification';


    var content = new helper.Content('text/html', '<html><body>Health degradation detected on the following Azure resources:<p>' +
    messageBody +
    '<p>Please review the information and take appropriate actions.');

    var mail = new helper.Mail(from_email, subject, to_email, content);
    
    var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
    var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON(),
        });
        
    sg.API(request, function(error, response) {
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
        });
    context.log('Function finished at: ', new Date().toISOString());
    context.done();
}