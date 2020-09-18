// index.js
// Zulaikha Zakiullah
// This is the script for the bot EZ-E.

class Cron {
    constructor(cron_exp) {
        var cron_arr = cron_exp.split(' ');
        this.minutes = this.get_num_array(cron_arr[0]);
        this.hours = this.get_num_array(cron_arr[1]);
        this.days_of_month = this.get_num_array(cron_arr[2]);
        this.month = this.get_num_array(cron_arr[3]);
        this.days_of_week = this.get_num_array(cron_arr[4]);
    }

    get_num_array(num_str) {
        var num_arr = [];
        if (num_str.includes('*')) {}
        else if (num_str.includes(',')) {
            var num_str_arr = num_str.split(',');
            for (let i=0; i<num_str_arr.length; i++) {
                num_arr.push(parseInt(num_str_arr[i]));
            }
        }
        else if (num_str.includes('-')) {
            var lower_bound = parseInt(num_str.split('-')[0]);
            var upper_bound = parseInt(num_str.split('-')[1]);
            for (let i=lower_bound; i<=upper_bound; i++) {
                num_arr.push(i);
            }
        }
        else {
            num_arr.push(parseInt(num_str));
        }
        return num_arr;
    }

    included(time_array, time) {
        return (time_array.includes(time) || time_array.length == 0);
    }

    matches_date(date) {
        return (this.included(this.minutes, date.getMinutes()) && this.included(this.hours, date.getHours()) &&
        this.included(this.days_of_month, date.getDate()) && this.included(this.month, date.getMonth()) &&
        this.included(this.days_of_week, date.getDay()));
    }

    matches_today(date) {
        return (this.included(this.days_of_month, date.getDate()) && this.included(this.month, date.getMonth()) &&
        this.included(this.days_of_week, date.getDay()));
    }

    get_time_string() {
        var time_str = "";
        for (let i=0; i<this.hours.length; i++) {
            for (let j=0; j<this.minutes.length; j++) {
                if (time_str) {
                    time_str += ", ";
                }
                // change 15 later to make it more modular
                var m = 60 - (this.minutes[i] + 15);
                var h = this.hours[i] + (this.minutes[i] + 15 >= 60 ? 1 : 0);
                var m_str = "";
                if (m == 0) {
                    m_str = "00";
                }
                else if (m > 0 && m < 10) {
                    m_str = `0${m.toString()}`;
                }
                else {
                    m_str = m.toString();
                }
                time_str += `${h.toString()}:${m_str}`;
            }
        }
        return time_str;
    }
}

// use fs
const fs = require('fs');

// get information from config file
const config = require('./config.json');
const prefix = config.prefix,
      token = config.token,
      help = config.help,
      courses = config.courses,
      drive = config.drive,
      meetings = config.meetings,
      links = config.links,
      emails = config.emails;

//const token = process.env.DISCORD_TOKEN;

var help_str = help[0];
for (let i=1; i<help.length; i++) {
    help_str += ("\n" + help[i]);
}

var dates = config.dates;

var cron_array = [];
var message_array = [];
var short_message_array = [];

var cron_check = setInterval(check_cron_expressions, 60000);

config_dates();

// require the discord.js module
const Discord = require('discord.js');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

// create a new Discord client
const client = new Discord.Client();

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
    client.user.setActivity("with binary trees 🌲");
});

// listen for messages
client.on('message', message => { 
    if (!message.content.startsWith(prefix) || message.author.bot) return; 
    
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    // if message has quotes, do not split by space

    // display all commands
    if (command == 'help') {
        return message.channel.send(`${message.author}\n${help_str}`);
    }
    // list all deadlines
    else if (command == 'reminders') {
        return message.channel.send(`Here's a list of important dates, ${message.author}\n`);
    }
    else if (command == 'send') {
        if (!args.length) {
            return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
        }
        var msg = message.content;
        var q = msg.match(/\"/g);
        if (q == null) {
            return message.channel.send(`You need quotations around your message, ${message.author}!`);
        }
        var num_quotes = q.length;
        num_quotes = !num_quotes ? 0 : num_quotes;
        if (num_quotes != 2) {
            return message.channel.send(`You have the wrong number of quotation marks, ${message.author}! There should be 2 but you have ${num_quotes}.`);
        }
        var arr = msg.split('"');
        var str = arr[1];
        var info = arr[2].split(/ +/);
        var to_ind = info.indexOf('to'),
            on_ind = info.indexOf('on'),
            at_ind = info.indexOf('at');
        if (on_ind == -1) {
            return message.channel.send(`You didn't specify a date, ${message.author}!`);
        }
        var people = to_ind == -1 ? message.author : info[to_ind + 1];
        if (people == null) {
            return message.channel.send(`You didn't specify a name/role, ${message.author}!`);
        }
        var time = at_ind == -1 ? "12:00am" : info[at_ind + 1];
        if (!time.match(/^(10|11|12|[1-9]):[0-5][0-9](a|p)m$/)) {
            return message.channel.send(`That time isn't formatted correctly, ${message.author}!`);
        }
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var month = info[on_ind + 1];
        if (month == null) {
            return message.channel.send(`You didn't specify a month, ${message.author}!`);
        }
        else if (months.indexOf(month) == -1) {
            return message.channel.send(`The month \`${month}\` doesn't exist, ${message.author}!`);
        }
        var m = months.indexOf(month);
        var day = parseInt(info[on_ind + 2]);
        if (day == null) {
            return message.channel.send(`You didn't specify a day, ${message.author}!`);
        }
        else if (isNaN(day)) {
            return message.channel.send(`You didn't give a number for the day, ${message.author}!`);
        }
        else if (day > days[m] || day < 1) {
            return message.channel.send(`\`${month} ${day}\` doesn't exist, ${message.author}!`);
        }
        var today = new Date();
        var y = today.getFullYear();
        var hr = parseInt(time.split(":")[0]) + (time.endsWith("pm") ? 12 : 0);
        var mt = parseInt(time.split(":")[1]);
        var d = new Date(y, m, day, hr, mt, 0, 0);
        if (today.getTime() > d.getTime()) {
            d.setFullYear(y + 1);
        }
        var obj = {
            message: str,
            to: people,
            month: m,
            day: day,
            hour: hr,
            minute: mt
        };
        var json = JSON.stringify(obj);
        fs.writeFile('data.json', json, 'utf8', callback);
        return message.channel.send(`Will do, ${message.author}!`);
    }
    else if (command == 'courses') {
        var courses_str = "\n";
        for (let i=0; i<courses.length-1; i++) {
            courses_str += `\`${courses[i]}\`, `;
        }
        courses_str += `\`${courses[courses.length-1]}\``;
        return message.channel.send(`${message.author} Here's the course list:${courses_str}`);
    }
    else if (command == 'breakdown' || command == 'contents') {
        var valid_courses = `Valid courses are `;
        for (let i=0; i<courses.length-1; i++) {
            valid_courses += `\`${courses[i]}\`, `;
        }
        valid_courses += `or \`${courses[courses.length-1]}\``;
        if (!args.length) {
            return message.channel.send(`I need a course name, ${message.author}! ${valid_courses}`);
        }
        else if (!courses.includes(args[0])) {
            return message.channel.send(`I don't recognize that course, ${message.author}! ${valid_courses}`);
        }
        return message.channel.send(`${message.author} Here's the ${command} for ${args[0]}`, {files: [`course_info/${command}_${args[0]}.png`]});
    }
    else if (command == 'meetings') {
        var valid_courses = get_valid_courses(meetings);
        if (!args.length) {
            return message.channel.send(`${message.author} I need a course name! ${valid_courses}`);
        }
        else if (!meetings.hasOwnProperty(args[0])) {
            return message.channel.send(`${message.author} There are no meetings for ${args[0]}! ${valid_courses}`);
        }
        var meetings_str = get_string_from_array(meetings[args[0]]);
        return message.channel.send(`${message.author} Here are the meeting links for ${args[0]}:\n\n${meetings_str}`);
    }
    else if (command == 'links') {
        var valid_courses = get_valid_courses(links);
        if (!args.length) {
            return message.channel.send(`${message.author} I need a course name! ${valid_courses}`);
        }
        else if (!links.hasOwnProperty(args[0])) {
            return message.channel.send(`${message.author} There are no additional links for ${args[0]}! ${valid_courses}`);
        }
        var links_str = get_string_from_array(links[args[0]]);
        return message.channel.send(`${message.author} Here are additional links for ${args[0]}:\n\n${links_str}`);
    }
    else if (command == 'drive') {
        var valid_courses = get_valid_courses(drive);
        if (!args.length) {
            return message.channel.send(`${message.author} I need a course name! ${valid_courses}`);
        }
        else if (!drive.hasOwnProperty(args[0])) {
            return message.channel.send(`${message.author} There is no Drive link for ${args[0]}! ${valid_courses}`);
        }
        return message.channel.send(`${message.author} Here's the drive link for ${args[0]}:\n${drive[args[0]]}`);
    }
    else if (command == 'emails') {
        var valid_courses = get_valid_courses(emails);
        if (!args.length) {
            return message.channel.send(`${message.author} I need a course name! ${valid_courses}`);
        }
        else if (!emails.hasOwnProperty(args[0])) {
            return message.channel.send(`${message.author} There are no emails listed for ${args[0]}! ${valid_courses}`);
        }
        var emails_str = get_string_from_array(emails[args[0]]);
        return message.channel.send(`${message.author} Here's the email list for ${args[0]}:\n\n${emails_str}`);
    }
    else if (command == 'today') {
        var today = new Date();
        var today_list = "\n";
        for (let i=0; i<cron_array.length; i++) {
            if (cron_array[i].matches_today(today)) {
                today_list += `\n${cron_array[i].get_time_string()} - ${short_message_array[i]}`;
            }
        }
        if (today_list == "\n") {
            today_list = "Nothing today!"
        }
        return message.channel.send(`${message.author} Here's what we have today: ${today_list}`);
    }
    else if (command == 'playing' || command == 'watching' || command == 'listening' || command == 'streaming') {
        if (!args.length) {
            return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
        }
        var msg = message.content;
        var q = msg.match(/\"/g);
        if (q == null) {
            return message.channel.send(`You need quotations around your message, ${message.author}!`);
        }
        var num_quotes = q.length;
        num_quotes = !num_quotes ? 0 : num_quotes;
        if (num_quotes != 2) {
            return message.channel.send(`You have the wrong number of quotation marks, ${message.author}! There should be 2 but you have ${num_quotes}.`);
        }
        var activity = msg.split('"')[1];
        client.user.setActivity(activity, { type: command.toUpperCase() });
        return message.channel.send(`${message.author} Check it out, I'm now ${command} ${activity}.`);
    }
    else if (command == 'avatar') {
        if (!args.length) {
            return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
        }
        else if (!args[0].match(/\.(jpeg|jpg|gif|png)$/)) {
            return message.channel.send(`${message.author} You didn't give me a valid photo. Valid photos are \`jpeg\`, \`jpg\`, \`gif\`, and \`png\`.`);
        }
        client.user.setAvatar(args[0]);
        return message.channel.send(`${message.author} Check out my new profile picture!`);
    }
    else if (command == 'logout') {
        clearInterval(cron_check);
        client.destroy();
    }
    else if (command == 'bully') {
        message.react('712739654398377985');
        message.react('🔥');
        if (!args.length) {
            return message.channel.send(`Who am I supposed to bully, ${message.author}?`);
        }
        return message.channel.send(`${message.author.username} told you to work, ${args[0]}! You think you can get a job at this rate?`);
    }
    else if (command == 'attack') {
        message.react('681719502295269376');
        message.react('🔫');
        if (!args.length) {
            return message.channel.send(`Who do I attack, ${message.author}? You?`);
        }
        return message.channel.send(`You've been attacked by ${message.author.username} with an uppercut, ${args[0]}! It was super effective.`);
    }
    else if (command == 'love') {
        message.react('681719963966505187');
        message.react('❤️');
        if (!args.length) {
            return message.channel.send(`I love you, ${message.author}! Don't ever forget that.`);
        }
        return message.channel.send(`${message.author.username} sends their love, ${args[0]}!`);
    }
    message.react('625923437105512468');
    message.react('🤔');
    return message.channel.send(`I don't understand what you just said, ${message.author}! Maybe you meant something else?`);
});

// login to Discord with your app's token
client.login(token);

function get_valid_courses(json_obj) {
    var keys = Object.keys(json_obj);
    var courses_str = `Valid courses are `;
    for (let i=0; i<keys.length-1; i++) {
        courses_str += `\`${keys[i]}\`, `;
    }
    courses_str += `or \`${keys[keys.length-1]}\``;
    return courses_str;
}

function get_string_from_array(str_array) {
    var str = str_array[0];
    if (str_array.length > 1) {
        for (let i=1; i<str_array.length; i++) {
            str += ("\n" + str_array[i]);
        }
    }
    return str;
}

function config_dates() {
    for (let i=0; i<dates.length; i++) {
        var cron_exp = dates[i].cron;
        var message = dates[i].message;
        var short_message = dates[i].short;
        var cron = new Cron(cron_exp);
        cron_array.push(cron);
        message_array.push(message);
        short_message_array.push(short_message);
    }
}

function check_cron_expressions() {
    var now = new Date();
    for (let i=0; i<cron_array.length; i++) {
        if (cron_array[i].matches_date(now)) {
            var channel = client.channels.cache.find(channel => channel.name === "rambles");
            channel.send(message_array[i]);
        }
    }
}
