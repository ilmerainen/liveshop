import './styles.css';
import { io } from 'socket.io-client';

const socket = io('chat.liveshopping.gr/chat');

const path = window.location.pathname;
const chatId = path.substring(path.lastIndexOf('/') + 1);
console.log('chatId: ' + chatId);
if (!chatId) {
  throw new Error('Chat room ID is not provided', path);
}

socket.on('connect', () => {
  console.log('Connected: ' + socket.id);
});

// will be created if not exists
await socket.emitWithAck('create_room', {
  id: chatId,
});

let hotProducts = [];

socket.on('receive_new_message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'text' && msg.content.startsWith('[hot-settings]')) {
    var message = msg.content;
    var ids = message.replace('[hot-settings]', '').split(',');
    console.log(ids);

    if (hotProducts !== ids) {
      hotProducts = ids;

      var hotProductItems = document.querySelectorAll(
        "li[name='hot-product-item']",
      );
      hotProductItems.forEach(function (item) {
        item.style.display = 'none';
      });

      ids.forEach(function (id) {
        var hotItem = document.getElementById('hot-' + id);
        if (hotItem) {
          hotItem.style.display = 'block';
        }
      });
    }
  } else {
    renderNewMessage({
      id: msg.id,
      username: msg.user.name,
      content: msg.content,
      role: msg.user.role,
      userId: msg.user.id,
      reply: msg.reply?.content,
      replyTo: msg.reply?.username,
      currentRole: localStorage.getItem('role'),
      likes: msg.likes,
      type: msg.type,
    });
    scrollToBottom('chatMessagesContainer');
  }
});

function renderNewMessages(messages, toStart = false) {
  for (const msg of messages) {
    renderNewMessage(
      {
        id: msg.id,
        username: msg.user.name,
        content: msg.content,
        role: msg.user.role,
        userId: msg.user.id,
        reply: msg.reply?.content,
        replyTo: msg.reply?.username,
        currentRole: localStorage.getItem('role'),
        likes: msg.likes,
        type: msg.type,
      },
      toStart,
    );
  }
}

function renderNewMessage(
  data = {
    id: null,
    username: null,
    userId: null,
    content: null,
    role: null,
    reply: null,
    replyTo: null,
    currentRole: null,
    likes: null,
  },
  toStart = false,
) {
  if (!data.username || !data.content || !data.role || !data.userId) {
    console.error(
      'To create new message "username", "content", "role", "userId" should be passed',
    );
    return;
  }

  if (data.content.startsWith('[hot-settings]')) {
    return;
  }

  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg-container';

  if (data.reply?.length && data.replyTo) {
    // todo: move to separate method

    msgEl.innerHTML += `<div class="chat-msg__reply-hold">
                 
                  <div class="reply-content">
                    <div class="reply-to-user">
                    <div class="reply-icon">
                    <img src="./assets/reply.svg" />
                  </div>
                 <div> ${data.replyTo}</div>
                 </div>
                    <div class="reply-on-msg">
                      ${data.reply}
                    </div>
                  </div>
                </div>`;
  }

  msgEl.innerHTML += `
                <div class="chat-msg ${
                  data.role === 'vendor' ? 'chat-msg_vendor' : ''
                }" data-id="${data.id}">
                <div class="chat-msg__user">${data.username}</div>
                <div class="chat-msg__content">
                  ${data.type === 'text' ? data.content : ''}
                  ${
                    data.type === 'sticker'
                      ? `<img class="sticker" src="${data.content}">`
                      : ''
                  }
                </div>
                ${
                  data.role === 'user'
                    ? `
                <div class="block-msg ${
                  data.currentRole === 'vendor' ? '' : 'hide'
                }">
                <div class="block-msg-btn">
                  <img src="./assets/cancel.svg" />
                  </div>
                </div>
                `
                    : ''
                }
                <div class="chat-msg__like ${
                  data.likes.likedByMe ? 'active' : ''
                }" data-liked-by-me="${data.likes.likedByMe}">
                    <i class="far fa-light fa-heart"></i>
              
                    
                      <div class="msg-like__counter" data-count="${
                        data.likes.count
                      }">${data.likes.count !== 0 ? data.likes.count : ''}</div>
                    
              </div>
              </div>`;
  const messagesEl = document.getElementById('chatMessages');
  messagesEl[toStart ? 'prepend' : 'append'](msgEl);
}

// handle errors
socket.on('message', (error) => {
  let parsed;
  try {
    parsed = JSON.parse(error);
  } catch {}

  if (parsed.event === 'error') {
    console.error(parsed.data);
  }
});

// Get messages with pagination. Should be called on init and when the chat is being paginated
const GET_ALL_MESSAGES_LIMIT = 20;
async function fetchMessages(
  chatId,
  pagination = {
    before: null,
    count: GET_ALL_MESSAGES_LIMIT,
  },
) {
  const payload = {
    chatId,
    before: pagination.before || undefined,
    count: pagination.count,
    userId: localStorage.getItem('chatUserId'),
  };
  const response = await socket.emitWithAck('request_all_messages', payload);
  return JSON.parse(response).data.messages;
}

async function fetchAndRenderMessages(
  chatId,
  toStart = false,
  pagination = {
    before: null,
    count: GET_ALL_MESSAGES_LIMIT,
  },
) {
  const messages = (await fetchMessages(chatId, pagination)).sort((a, b) =>
    toStart ? b.id - a.id : a.id - b.id,
  );
  renderNewMessages(messages, toStart);
}

// init
const onReady = async () => {
  // handle form
  let userId = localStorage.getItem('chatUserId');

  if (!userId) {
    const userInput = document.querySelector('#chatForm input[name="name"]');

    if (userInput) {
      userInput.style.display = 'block';
    }
  }

  if (userId) {
    document.querySelector('#selectRole').remove();
    document.querySelector('#login-data').remove();
  }

  // load messages
  await fetchAndRenderMessages(chatId, false);
  scrollToBottom('chatMessagesContainer');

  var localRole = localStorage.getItem('role');

  var localSelectRole = document.getElementById('selectRole');

  var localSelectedRole = localSelectRole ? localSelectRole.value : null;

  if (localRole === 'vendor' || localSelectedRole === 'vendor') {
    // hot products
    updateHotProducts(false);

    // setInterval(function() {
    //   updateHotProducts(true);
    // }, 1000);

    var hotProductSelections = document.querySelectorAll(
      "input[name='hot-product-selection']",
    );
    hotProductSelections.forEach(function (hotProductSelection) {
      hotProductSelection.addEventListener('change', function () {
        console.log(this);
        updateHotProducts(true);
      });
    });
  }
};

if (document.readyState !== 'loading') {
  await onReady();
} else {
  document.addEventListener('DOMContentLoaded', onReady);
}

// handle form submit
const form = document.getElementById('chatForm');
const loginWrapper = document.getElementById('login-data');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginWrapper.style.display = 'none';
  const formData = new FormData(e.target);
  const content = formData.get('msg');
  let role;
  // todo: should be reworked
  if (formData.get('role')) {
    role = formData.get('role');
  }

  await sendMessage({
    type: 'text',
    role,
    content,
  });
});

async function sendMessage({ type, role, content } = {}) {
  console.log({ type, role, content });
  if (!content) {
    console.error('error on msg submit');
    return;
  }

  const payload = {
    chatId,
    content,
    role: role || 'user',
    type,
  };

  const curReply = document.getElementById('curReply');
  const msgInput = form.querySelector('input[name="msg"]');
  const userId = localStorage.getItem('chatUserId');
  const userInput = form.querySelector('input[name="name"]');
  const username = userInput?.value;

  if (userId) {
    payload.userId = userId;
  } else if (username) {
    payload.username = username;
  } else if (role === 'vendor') {
    payload.username = 'Vendor';
  } else {
    // todo: handle error
    console.error('error on msg submit');
    return;
  }

  if (curReply && curReply.dataset.replyToMsgId) {
    payload.replyTo = +curReply.dataset.replyToMsgId;
  }
  console.log(payload);

  const response = await socket.emitWithAck('send_message', payload);
  const parsedRes = JSON.parse(response);

  console.log(response);

  if (parsedRes.success) {
    if (content.startsWith('[hot-settings]')) {
    } else {
      localStorage.setItem('chatUserId', parsedRes.data.userId);
      userInput?.remove();
      msgInput.value = '';
      deleteCurrentReply();
      scrollToBottom('chatMessagesContainer');

      if (role) {
        // todo: should be replaced for prod
        payload.role = role;
        localStorage.setItem('role', role + '');
        document.querySelector('#selectRole')?.remove();

        if (role === 'vendor') {
          document.querySelectorAll('.block-msg').forEach((msg) => {
            msg.classList.remove('hide');
          });
        }
      }
    }
  }
}

socket.on('like_message', (data) => {
  const parsed = JSON.parse(data);
  const counterEl =
    document.querySelector(`.chat-msg[data-id="${parsed.messageId}"] 
  .chat-msg__like .msg-like__counter`);
  console.log(parsed);
  counterEl.innerHTML = parsed.count;
  counterEl.dataset.count = parsed.count;
});

document.getElementById('chatMessages').addEventListener('click', (e) => {
  const likeContainer = e.target.closest('.chat-msg__like');

  if (likeContainer) {
    likeContainer.classList.toggle('active');

    const userId = localStorage.getItem('chatUserId');

    if (!userId) {
      return;
    }

    const likedByMe = likeContainer.dataset.likedByMe === 'true';
    likeContainer.dataset.likedByMe = (!likedByMe).toString();
    const messageId = +likeContainer.closest('.chat-msg').dataset.id;

    const counterEl = likeContainer.querySelector('.msg-like__counter');
    const count = +counterEl.dataset.count + (likedByMe ? -1 : 1);
    counterEl.innerHTML = count !== 0 ? count : '';
    counterEl.dataset.count = count;

    socket.emit('like_message', {
      userId,
      chatId,
      messageId,
      action: likedByMe ? 'delete' : 'add',
    });
  }
});

// add reply by double-click on message
const chatMessages = document.getElementById('chatMessages');
chatMessages.addEventListener('dblclick', holdReply);
chatMessages.addEventListener('touchend', holdReply);

function holdReply(e) {
  if (e.target.closest('.chat-msg__like')) {
    e.stopPropagation();
    return;
  }

  const closestMsg = e.target.closest('.chat-msg');

  if (closestMsg) {
    const msgContent =
      closestMsg.querySelector('.chat-msg__content')?.innerText;
    const msgUserEl = closestMsg.querySelector('.chat-msg__user');

    // validate reply
    if (
      !msgContent ||
      msgContent.length <= 0 ||
      !msgUserEl ||
      msgUserEl.innerText.length <= 0
    ) {
      console.error('Error on adding reply by double-click on message');
      return;
    }

    e.stopPropagation();

    const reply = document.getElementById('curReply');
    reply.classList.remove('hide');
    reply.dataset.replyToMsgId = closestMsg.dataset.id;
    reply.innerHTML = `
              
                  <div class="reply-content">
                    <div class="reply-to-user">
                    <div class="reply-icon">
                    <img src="./assets/reply.svg" />
                  </div>
                  <div>${msgUserEl.innerText}</div>
                  </div>
                    <div class="reply-on-msg">
                      ${
                        msgContent.length < 30
                          ? msgContent
                          : msgContent.substring(0, 27) + '...'
                      }
                    </div>
                  </div>
                </div>
              <div class="reply-cancel" id="cancelReply">
                <img src="./assets/cancel.svg" />
              </div>
              </div>`;

    // handle add && cancel reply
    reply.querySelector('#cancelReply').addEventListener('click', () => {
      deleteCurrentReply();
    });
  }
}

// handle user blocking
document.getElementById('chatMessages').addEventListener('click', (e) => {
  const isBlockMsg = e.target.closest('.block-msg-btn');

  if (isBlockMsg) {
    const msg = e.target.closest('.chat-msg');
    socket.emit('block_message', {
      userId: localStorage.getItem('chatUserId'),
      msgId: +msg.dataset.id,
      chatId,
    });
  }
});

socket.on('block_message', (data) => {
  const parsed = JSON.parse(data);
  document.querySelector(
    `.chat-msg[data-id="${parsed.id}"] .chat-msg__content`,
  ).innerText = parsed.content;
});

function deleteCurrentReply() {
  const el = document.getElementById('curReply');

  if (el) {
    el.innerHTML = '';
    el.classList.add('hide');
    el.dataset.replyToMsgId = null;
  }
}

// handle infinite scroll
const messagesEnd = document.getElementById('chatMessagesEnd');
const intersectionObserver = new IntersectionObserver(async (entries) => {
  if (entries[0].intersectionRatio <= 0) {
    return;
  }

  const lastMsgContainer = document.querySelector(
    '#chatMessages .chat-msg-container:first-child',
  );
  const lastMsg = lastMsgContainer?.querySelector('.chat-msg');

  if (lastMsg?.dataset?.id) {
    await fetchAndRenderMessages(chatId, true, {
      before: +lastMsg.dataset.id,
    });
    const messagesContainer = document.querySelector('#chatMessagesContainer');
    messagesContainer.scrollTop = lastMsgContainer.offsetTop;
  }
});
intersectionObserver.observe(messagesEnd);

// helper
function scrollToBottom(id) {
  const element = document.getElementById(id);
  element.scrollTo(0, element.scrollHeight);
}

function animateHearts() {
  const heartsParent = document.querySelector('.chat__send_like');

  const heart = document.createElement('i');
  heart.className = 'far fa-light video-hearts fa-heart';
  heart.style.top = 0;
  heart.style.left = '-2vw';
  heartsParent.appendChild(heart);
  const animationScenarios = [
    [
      { opacity: 0, left: '-2vw', top: '0vh' },
      { opacity: 1, left: '2vw', top: '-5vh' },
      { opacity: 1, left: '-2vw', top: '-15vh' },
      { opacity: 1, left: '2vw', top: '-25vh' },
      { opacity: 1, left: '-2vw', top: '-35vh' },
      { opacity: 1, left: '2vw', top: '-45vh' },
      { opacity: 0, left: '-2vw', top: '-55vh' },
    ],
    [
      { opacity: 0, left: '-3vw', top: '0vh' },
      { opacity: 1, left: '1vw', top: '-8vh' },
      { opacity: 1, left: '-3vw', top: '-18vh' },
      { opacity: 1, left: '1vw', top: '-28vh' },
      { opacity: 1, left: '-2vw', top: '-38vh' },
      { opacity: 1, left: '1vw', top: '-48vh' },
      { opacity: 0, left: '-1vw', top: '-58vh' },
    ],
    [
      { opacity: 0, left: '-1vw', top: '0vh' },
      { opacity: 1, left: '1vw', top: '-3vh' },
      { opacity: 1, left: '-1vw', top: '-13vh' },
      { opacity: 1, left: '1vw', top: '-23vh' },
      { opacity: 1, left: '-1vw', top: '-33vh' },
      { opacity: 1, left: '1vw', top: '-43vh' },
      { opacity: 0, left: '-1vw', top: '-53vh' },
    ],
  ];

  function getRandomScenario() {
    const randomIndex = Math.floor(Math.random() * animationScenarios.length);
    return animationScenarios[randomIndex];
  }
  const randomScenario = getRandomScenario();
  const animation = heart.animate(randomScenario, {
    duration: 2700,
    fill: 'forwards',
  });
  animation.addEventListener('finish', () => {
    heartsParent.removeChild(heart);
  });
  // animation.onfinish(() => {
  //   document.body.removeChild(heart);
  // });
  // heartsParent.classList.add('animate');
  // setTimeout(() => {
  //   heartsParent.classList.remove('animate');
  // }, 1000);
}

document.querySelector('#sendLikeBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  const userId = localStorage.getItem('chatUserId');

  socket.emit('send_like', {
    userId,
    chatId,
  });
  animateHearts();
});

socket.on('send_like', () => {
  // const parsed = JSON.parse(data);
  animateHearts();
});

document
  .querySelector('#stickersContainer')
  .addEventListener('click', async (e) => {
    const sticker = e.target.closest('.sticker');
    const formData = new FormData(document.getElementById('chatForm'));
    let role;
    // todo: should be reworked
    if (formData.get('role')) {
      role = formData.get('role');
    }

    if (sticker) {
      await sendMessage({
        type: 'sticker',
        content: sticker.src,
        role,
      });
    }
  });

document.querySelector('#stickersBtn').addEventListener('click', () => {
  document.querySelector('#stickersContainer').classList.toggle('hide');
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.stickers-btn')) {
    document.querySelector('#stickersContainer').classList.add('hide');
  }
});

function updateHotProducts(isSendMessage) {
  var productIds = document.querySelectorAll(
    "input[name='hot-product-selection']:checked",
  );
  var ids = [];
  productIds.forEach(function (productId) {
    var sThisVal = productId.checked ? productId.value : '';
    ids.push(sThisVal);
  });
  console.log(ids);

  var hotProductItems = document.querySelectorAll(
    "li[name='hot-product-item']",
  );
  hotProductItems.forEach(function (item) {
    item.style.display = 'none';
  });

  ids.forEach(function (id) {
    var hotItem = document.getElementById('hot-' + id);
    if (hotItem) {
      hotItem.style.display = 'block';
    }
  });

  if (isSendMessage) {
    // send message to all clients
    sendMessage({
      type: 'text',
      content: '[hot-settings]' + ids,
      role: 'vendor',
    }).catch((e) => console.log(e));
  }
}
