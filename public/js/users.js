class User {
    constructor (user) {
        this.id = user.id;
        this.nick = user.nick;
        this.connectedOn = user.connectedOn;
        this.activeOn = user.activeOn;
        this.publicKey = user.publicKey;
    }
}

/**
 * Update list of user.
 * @param {User | String} user 
 */

function updateUsersList (user) {
    if (!user) {
        // do nothing
        console.log('null - user')
    }
    else if (typeof user == 'object') {
        const userIndex = CHAT.usersOnline.findIndex(x => x.id == user.id);
        const newUser = new User(user);
        if (userIndex == -1) {
            // console.log('New user added to list. ', user);
            CHAT.usersOnline.push(newUser);
            const classes = ['user'];
            if (newUser.id == settings['userId']) {
                classes.push('user-me');
            }
            $('#users-list').append($(`<li class="${classes.join(' ')}" id="${newUser.id}">${newUser.nick}<div class="info">connected on: ${toDate(newUser.connectedOn)}</div></li>`));
        }
        else {
            // console.log('User already on list - update. ', newUser);
            CHAT.usersOnline[userIndex] = newUser;
            $(`#${newUser.id}`).html(`${newUser.nick}<div class="info">connected on: ${toDate(newUser.connectedOn)}</div>`);
        }
    }
    else {
        // console.log('on: user-disconnected ', user); // user = id here
        CHAT.usersOnline = CHAT.usersOnline.filter(x => x.id != user);
        $('#'+user).remove();
    }
}