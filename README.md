# Slack bot api

### What?

Some times we need to send a message to slack and this api will send a message for you!

### Pre reqs?

So, in order to use this api there are a few requirements. 
- You must send the Content-Type header as `application/vnd.api+json`, because this api follows the [JSON API spec](https://jsonapi.org/)
- For every request you must also send an additional header called `slack-bot-token` which is the Bot User OAuth Access Token given with a slack app under "OAth & Permissions"

### How do I use it?

There are only 2 endpoints
- `GET /` is just a friendly message
**Status:** `200`
```
{
    "data": {
        message:
          'Welcome to the optimizely feature flag api microservice. Create a full stack account and some feature flags to start using me.'
    }
}
```
- `POST /` which is basically just a wrapper around slack's [chat.postMessage](https://api.slack.com/methods/chat.postMessage) endpoint
**Status:** `200`
```
{
    "data": {...slackresponse}
    }
}