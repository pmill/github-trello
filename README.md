# GitHub Trello
### GitHub Action to attach GitHub branches to a Trello card

#### Action Variables
- **trello-api-key** - Trello API key, visit https://trello.com/app-key for key
- **trello-auth-token** - Trello auth token, visit https://trello.com/app-key then click generate a token
- **trello-board-id** - Trello board ID, visit a board then append .json to url to find id

#### GitHub Action
```
name: GitHub Trello

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      - uses: pmill/github-trello@v1
        with:
          trello-api-key: ${{ secrets.TRELLO_KEY }}
          trello-auth-token: ${{ secrets.TRELLO_TOKEN }}
          trello-board-id: ${{ secrets.TRELLO_BOARD }}
```