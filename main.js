require('dotenv').config()
const fs = require('fs');
const inquirer = require('inquirer');
const axios = require('axios');
const axiosThrottle = require('axios-throttle');

let instance;
axiosThrottle.init(axios, 200)
const token = process.env.TOKEN

if (token === undefined) {
    console.log(`Set up your .env with a TOKEN='17~123213131232131'`);
    return process.exit();
}

const main = () => {
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
            // getting list of reports from domain
            instance.get(`/accounts/self/reports`)
                .then(reports => {
                    const reportTitles = [];
                    reports.data.forEach(report => {
                        reportTitles.push(report.title)
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
                            let params = {};
                            // If wanting provisioning or sis export, what items within there do they want?
                            if (res.report === 'Provisioning' || res.report === 'SIS Export') {
                                new inquirer
                                    .prompt({
                                        type: "checkbox",
                                        message: "What types of files do you want to run?",
                                        choices: ['users', 'accounts', 'terms', 'courses', 'sections', 'enrollments', 'groups', 'group_membership', 'group_categories', 'x_list', 'user_observer', 'admin', 'created_by_sis'],
                                        name: 'objects'
                                    })
                                    .then(res => {
                                        res.objects.forEach(object => {
                                            params[object] = true;
                                        });
                                        reports.data.forEach(report => {
                                            console.log("made it here");
                                            // matching the title of the chosen report from the list of all reports
                                            // todo this part is not fully working
                                            if (report.title === res.report) {
                                                instance.post(`/accounts/self/reports/${report.report}`, params)
                                                    .then(res => {
                                                        console.log(res);
                                                    })
                                            }
                                        });
                                    })
                            }
                            // running specific report
                        })
                })
        })
        .catch(error => {
            console.log(error);
        });
}

main();