# Resource Health API

Azure resource health APIs expose the health of the individual Azure resources and provide actionable guidance to troubleshoot problems that, otherwise, would result in extended troubleshooting at the application level.

These APIs provide information which is more granular than the Service Health Dashboard. Service Health Dashboard provides information about the issues that impact the availability of the resources in a region while the resource health can provide information on the platform events that affect smaller number of customers. For example, when a faulty hardware causes multiple nodes to fail over to a healthy rack in the Azure data centers.

Read more about Resoure health here - https://azure.microsoft.com/en-in/blog/reduce-troubleshooting-time-with-azure-resource-health/

# What does this code do?

The code in this repository is an Node.js based Azure Function which works at the Azure subscription level to look for the resources who have been marked Unhealthy, Unknown or Stopped. if any such resource are found, the information about the resource name, type and status information is sent to the users using the SendGrid APIs.

The code uses the ADAL-NODE node module to obtain the authentication token to access the resource health information. Before ADAL-NODE can be used, you need to create an AD Application and a service principal. This document describes the process - https://docs.microsoft.com/en-in/azure/azure-resource-manager/resource-group-authenticate-service-principal-cli

Once you have created the AD Application and the service principal, you will need to get an access token to register your subscription with the Resource health APIs. Information on how to get an access token can be found here - 

https://docs.microsoft.com/en-in/azure/azure-resource-manager/resource-manager-rest-api#generating-an-access-token

Now you can register your subscription by submitting a POST request to the following URL -

https://management.azure.com/subscriptions/<YOUR SUBSCRIPTION ID>/providers/Microsoft.ResourceHealth/register?api-version=2015-01-01

The only remaining piece of information is the SENDGRID API Key to send emails. This information can be obtained from the SendGrid management portal - https://app.sendgrid.com/

Once you have followed the steps mentioned above, you need to add the following app settings to your functions app -

+ subId - this is your subscription id
+ tenantID - this is the tenant id
+ clientID - this the id of your Azure AD app
+ resource - this should be set to "https://management.azure.com/"
+ authURLBasesecret - this value should be set to "https://login.windows.net/"
+ SENDGRID_API_KEY - this should be set to the SendGrid API key that you have obtained from the SendGrid management portal

Now, create a Node.js functions app and add the code from index.js in this repository to the function. Once you run the function, the code will iterate through all the resources in your subscription and iterates to ascertain the status of Azure resources. The information about the resources that are found to be in non-Healthy state is sent to the users as configured.

The following node-modules are required apart from the others modules already available with Node.js based Azure Functions environment.

1. sendgrid
2. restler
3. adal-node

Resource Health status is updated every 15-minutes at the platform level hence the minimum recommended time duration to trigger this function is 15-minutes as well.

However, you can also add HTTP triggger if you are wish to get the latest information in case you run in to issues accessing your Azure applications.
