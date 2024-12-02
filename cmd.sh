#!/bin/bash

# Functions for each command
unaccepted_list() {
  curl -X GET localhost:8000/conversations/unaccepted-list
}

unfinished_list() {
  curl -X GET localhost:8000/conversations/unfinished-list
}

accept() {
  local conversation_id=$1
  local user_id=$2
  echo $conversation_id
  echo $user_id
  if [ -n "$conversation_id" ] && [ -n "$user_id" ]; then
    curl -X POST localhost:8000/conversations/${conversation_id}/accept \
      -H "content-type: application/json" \
      -d "{\"user_id\": \"${user_id}\"}"
  else
    echo "Error: 'accept' requires conversation_id and user_id arguments."
  fi
}

reject() {
  local conversation_id=$1
  local user_id=$2
  if [ -n "$conversation_id" ] && [ -n "$user_id" ]; then
    curl -X POST localhost:8000/conversations/${conversation_id}/reject \
      -H "content-type: application/json" \
      -d "{\"user_id\": \"${user_id}\"}"
  else
    echo "Error: 'reject' requires conversation_id and user_id arguments."
  fi
}

message() {
  local conversation_id=$1
  local user_id=$2
  local body=$3
  if [ -n "$conversation_id" ] && [ -n "$user_id" ] && [ -n "$body" ]; then
    curl -X POST localhost:8000/conversations/${conversation_id}/message \
      -H "content-type: application/json" \
      -d "{\"user_id\": \"${user_id}\", \"body\": \"${body}\"}"
  else
    echo "Error: 'message' requires conversation_id, user_id, and body arguments."
  fi
}

# Main entry point
main() {
  local cmd=$1
  shift # Shift to remove the command from arguments
  
  case $cmd in
    "unaccepted-list")
      unaccepted_list
      ;;
    "unfinished-list")
      unfinished_list
      ;;
    "accept")
      accept "$@"
      ;;
    "reject")
      reject "$@"
      ;;
    "message")
      message "$@"
      ;;
    *)
      echo "Error: Unknown command '${cmd}'. Supported commands are: unaccepted-list, unfinished-list, accept, reject, message."
      ;;
  esac
}

# Run the script with the provided arguments
main "$@"
