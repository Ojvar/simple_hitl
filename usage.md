

# Create Request  (BotPress)

First, at the botpress side, we should send a request to HITL service

```bash
curl -X POST http://localhost:8000/hook \
    -H "content-type: application/json" \
    -d '{ 
"type": "create-request",
"data": {
  "web_hook": "https://webhook.botpress.cloud/0082b408-7639-458b-875b-b37b6a5973a0", 
  "web_hook_meta": { "secret": "secret" }, 
  "conversation_id": "conv_XXXXXXXXXXXXXXXXXXXX" }
}'
```


# List of Requests (HITL)

Second, at the HITL side, can get requests list 

```bash
curl -X GET http://localhost:8000/conversations/unaccepted-list \
    -H "content-type: application/json"
```


# Accept/Reject a request (HITL)

To accept a conversation

```bash
curl -X POST http://localhost:8000/conversations/{id}/accept \
    -H "content-type: application/json" \
    -d '{ "user_id": "user_id_XXXXXXXXX" }'
```


To reject a conversation

```bash
curl -X POST http://localhost:8000/conversations/{id}/reject \
    -H "content-type: application/json" \
    -d '{ "user_id": "user_id_XXXXXXXXX" }'
```


# Send Message to HITL (BotPress)

At the BotPress side, send message to HITL


```bash
curl -X POST http://localhost:8000/hook \
    -H "content-type: application/json" \
    -d '{ 
"type": "message",
"data": {
    "conversation_id": "conv_XXXXXXXXXXXXXXXXXXXX",
    "message": "Hello world" 
  }
}'
```

