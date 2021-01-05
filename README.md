# canvas-reports
# canvas-reports
Purpose of this:
1. Request a report from a specific Canvas instance
2. Watch the report to see when it's done
3. Give you a link to download it directly when finished

## To Setup
1. Create a .env file at the /canvas-reports which includes your token in this format:
TOKEN='17~3123123123123123132312'

2. Install the package.json by navigating to /canvas-reports and installing with 
```
npm install
```
or
```
yarn install
```
## To run
Run this command at the root of /canvas-reports
```
npm start
```
or
```
yarn start
```
It will run through and ask you what domain you want to pull the report from, an example would be "jjohnson" for jjohnson.instructure.com
Then it will ask you what reports you want to run. If you choose SIS Export or Provisioning you will have further options available.
Then when completed it will provide the link for you to click to start downloading the report to your standard download location through your browser.