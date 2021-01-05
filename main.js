require('dotenv').config()
const fs = require('fs');
const inquirer = require('inquirer');
const axios = require('axios');
const axiosThrottle = require('axios-throttle');
const {
    resolve
} = require('path');

let instance;
let domain;
axiosThrottle.init(axios, 200)
const token = process.env.TOKEN
const debug = false;

if (token === undefined) {
    console.log(`Set up your .env with a TOKEN='17~123213131232131'`);
    return process.exit();
}

const main = () => {
    let runReport = new Promise((resolve, reject) => {
        inquirer
            .prompt([{
                type: "input",
                message: "What is the domain (not '.instructure.com') of where the report is that you want to run?",
                name: "domain",
            }])
            .then(answers => {
                instance = axios.create({
                    baseURL: `https://${answers.domain}.instructure.com/api/v1`,
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                domain = answers.domain;
                // getting list of reports from domain
                instance.get(`/accounts/self/reports`)
                    .then(reports => {
                        const reportTitles = [];
                        reports.data.forEach(report => {
                            if (report.title === 'Provisioning' || report.title === 'SIS Export') {
                                reportTitles.unshift(report.title);
                            } else {
                                reportTitles.push(report.title);
                            }
                        });
                        // prompting which report specifically want to run
                        new inquirer
                            .prompt({
                                type: "list",
                                message: "What report do you want to run?",
                                choices: reportTitles,
                                name: 'report'
                            })
                            .then(res => {
                                let parameters = {
                                    parameters: {}
                                };
                                // If wanting provisioning or sis export, what items within there do they want?
                                let chosenReport = res.report;
                                let reportCodeName;
                                // matching the title of the chosen report from the list of all reports
                                reports.data.forEach(report => {
                                    if (report.title === chosenReport) {
                                        reportCodeName = report.report
                                    }
                                });


                                // when running provisioning or sis export getting the additional parameters
                                if (chosenReport === 'Provisioning' || chosenReport === 'SIS Export') {
                                    new inquirer
                                        .prompt([{
                                            type: "checkbox",
                                            message: "What types of files do you want to run? You must choose at least one for it to work successfully.",
                                            // todo deleted objects
                                            choices: ['users', 'accounts', 'terms', 'courses', 'sections', 'enrollments', 'groups', 'group_membership', 'group_categories', 'x_list', 'user_observer', 'admin', 'created_by_sis'],
                                            name: 'objects'
                                        }, {
                                            type: 'confirm',
                                            message: 'Do you want to include deleted?',
                                            name: 'includeDeleted'
                                        }])
                                        .then(res => {
                                            // todo need to fix parameters
                                            res.objects.forEach(object => {
                                                parameters.parameters[object] = true;
                                            });
                                            if (res.includeDeleted) {
                                                parameters.parameters['include_deleted'] = true;
                                            }
                                            console.log("🚀 ~ file: main.js ~ line 60 ~ main ~ parameters", parameters)
                                            instance.post(`/accounts/self/reports/${reportCodeName}`, parameters)
                                                .then(res => {
                                                    if (debug) {
                                                        console.log(`report success here`, res.data);
                                                    }
                                                    let cb = {
                                                        id: res.data.id,
                                                        reportCodeName: reportCodeName
                                                    }
                                                    resolve(cb);
                                                    console.log(`Running ${chosenReport} report now`);
                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                })
                                        })
                                } else {
                                    instance.post(`/accounts/self/reports/${reportCodeName}`, parameters)
                                        .then(res => {
                                            if (debug) {
                                                console.log(res);
                                            }
                                            let cb = {
                                                id: res.data.id,
                                                reportCodeName: reportCodeName
                                            }
                                            resolve(cb);
                                            console.log(`Running ${chosenReport} report now`);
                                        })
                                        .catch(err => {
                                            console.log(err);
                                        })
                                }
                                // running specific report
                            })
                    })
            })
            .catch(error => {
                console.log(error);
            });
    })
    runReport.then((cb) => {
        console.log("🚀 ~ file: main.js ~ line 128 ~ runReport.then ~ reportCodeName", cb.reportCodeName)
        let checkReport = () => {
            console.log("checking to see if the report is finished....");
            instance.get(`/accounts/self/reports/${cb.reportCodeName}/${cb.id}`)
                .then(res => {
                    if (res.data.status === 'complete') {
                        console.log(`Report finished, download by clicking here: ${res.data.attachment.url}`);
                        clearInterval(interval);
                    }
                })
                .catch(err => {
                    console.log(err);
                })
        }
        let interval = setInterval(checkReport, 5000);
    })
}

main();