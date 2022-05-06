document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

 
  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  let alert = document.querySelector('#alert')
  alert.style.display = 'none';

  // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  
  document.querySelector('#compose-form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector("#compose-recipients").value,
        subject: document.querySelector("#compose-subject").value,
        body: document.querySelector("#compose-body").value
      })
    })
    .then(response => response.json())
    .then(result => {
        if (result.error){
          alert.style.display = 'block';
          alert.innerHTML = result.error;
        }
        else{
          load_mailbox("sent");
        }
    })
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    for (let i = 0; i < emails.length; i++) {
      let anchor = document.createElement('a');
      anchor.style.textDecoration = "none";
      anchor.style.color = "black"
      let div = document.createElement('div');
      
      div.className = "email-div";

      if (emails[i].read === true && mailbox === "inbox") {
        div.style.backgroundColor = "gray";
      }
      if (mailbox === "inbox"){
        div.innerHTML = `<h3>From ${emails[i].sender}: ${emails[i].subject}<h3>\
        <p><small>${emails[i].timestamp}</small></p>`
      }
      else if (mailbox === "sent") {
        div.innerHTML = `<h3>To ${emails[i].recipients}: ${emails[i].subject}<h3>\
        <p><small>${emails[i].timestamp}</small></p>`
      }

      anchor.append(div);
      anchor.onclick = function() {
        fetch(`/emails/${emails[i].id}`)
        .then(response => response.json())
        .then(email => {
          load_email(email, mailbox);
        })
      }
      document.querySelector("#emails-view").append(anchor);
    }
  });
}

function send_mail() {
}

function load_email(email, type) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  document.querySelector('#subject').innerHTML = email.subject;
  document.querySelector('#sender').innerHTML = email.sender;
  document.querySelector('#recipients').innerHTML = `${email.recipients}  <small>${email.timestamp}</small>`;
  document.querySelector('#body').innerHTML = email.body;

  document.querySelector('#reply-button').onclick = function () {
    compose_email();
    document.querySelector('#compose-recipients').value = email.sender;
    if (email.subject.slice(0, 3)==="Re:")
    {
      document.querySelector('#compose-subject').value = email.subject;
    }
    else {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    document.querySelector('#compose-body').value = `\n\n>>On ${email.timestamp} ${email.sender} wrote: ${email.body}\n`;
  }

  document.querySelector('#archive-button').onclick = function() {
    if (email.archived) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
      }).then(()=>{load_mailbox("inbox")})
    }
    else {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
      }).then(()=>{load_mailbox("inbox")})
    }
    
    
  }
  
  if (type ==="inbox") {
    document.querySelector('#archive-button').style.display = "block";
    document.querySelector('#reply-button').style.display = "block";
    document.querySelector('#archive-button').innerHTML = "Archivate";
  }
  else if (type === "archive") {
    document.querySelector('#archive-button').style.display = "block";
    document.querySelector('#reply-button').style.display = "none";
    document.querySelector('#archive-button').innerHTML = "Unarchivate";
  }

  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}