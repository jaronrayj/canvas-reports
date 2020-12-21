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
            message: "What is the domain of the report you want to run? DOMAIN.instructure.com",
            name: "domain",
        }])
        .then(answers => {
            instance = axios.create({
                baseURL: `https://${answers.domain}.instructure.com/api/v1`,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            // new Promise((resolve, reject) => {
            instance.get(`/accounts/self/reports`)
                .then(reports => {
                    const listOfReports = [];
                    reports.data.forEach(report => {
                        listOfReports.push(report.title)
                    });
                    new inquirer
                        .prompt({
                            type: "list",
                            message: "What report do you want to run?",
                            choices: listOfReports,
                            name: 'report'
                        })
                        .then(res => {
                            let params;
                            if (res.report === 'Provisioning' || res.report === 'SIS Export') {
                                new inquirer
                                    .prompt({
                                        type: "checkbox",
                                        message: "What types of files do you want to run?",
                                        choices: ['Basic Provisioning', 'all', 'users', 'accounts', 'terms', 'courses', 'sections', 'enrollments', 'groups', 'group membership', 'group categories', 'x list', 'user observer', 'admin', 'created by sis'],
                                        name: 'objects'
                                    })
                                    .then(res => {
                                        console.log("🚀 ~ file: main.js ~ line 57 ~ //newPromise ~ res.objects", res.objects)
                                        switch (res.objects) {
                                            case 'all':
                                                params = ['users', 'accounts', 'terms', 'courses', 'sections', 'enrollments', 'groups', 'group membership', 'group categories', 'x list', 'user observer', 'admin', 'created by sis'];
                                                break;
                                            case 'Basic Provisioning':
                                                params = ['users', 'accounts', 'terms', 'courses', 'sections', 'enrollments'];
                                                break;
                                            default:
                                                params = res.objects;
                                                break;
                                        }
                                        // res.forEach(chosenReport => {
                                        // });
                                    })
                            }
                            // res.forEach(chosenReport => {
                            // });
                        })
                })
            // })
        })
        .catch(error => {
            if (error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
            } else {
                console.log(error);
            }
        });
}

main();