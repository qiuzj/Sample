/**
 * 初始化
 * 
 * @returns
 */
function init() {
    if (window.WebSocket) {
    	// 连接服务端
        websocket = new WebSocket("ws://127.0.0.1:8080");
        
        // 接收消息事件
        websocket.onmessage = function (event) {
            onmsg(event);
        };
        // 连接打开事件
        websocket.onopen = function () {
            bind();
            heartBeat.start(); // 启动心跳计时器
        }
        // 连接关闭事件
        websocket.onclose = function () {
            reconnect();
        };
        // 发生错误事件
        websocket.onerror = function () {
            reconnect();
        };
    } else {
        alert("您的浏览器不支持WebSocket协议！");
    }
}

/**
 * 发送登录请求
 * 
 * @returns
 */
function bind() {
    if (window.WebSocket) {
        if (websocket.readyState == WebSocket.OPEN) {
            var bindJson = '{ "type": 1, "data": {"uid":' + $("#sender_id").val() + ' }}';
            websocket.send(bindJson);
        }
    } else {
        return;
    }
}

// 处理所有web端接收到的数据
var onmsg = function (event) {
    if (event != '') {
    	// 重新启动心跳计时器
        heartBeat.reset();
        
        var resp = $.parseJSON(event.data);
        if (resp != null) {
            switch (resp.type) {
                case 1: // 登录响应
                    handleBindResp(resp);
                    break;

                case 2: // 查询消息响应
                    handleQueryMsgResp(resp);
                    break;

                case 3: // 发送消息响应
                    handleSendMsgResp(resp);
                    break;

                case 4: // 接收服务端消息
                    handleReceivedMsg(resp);
                    break;

                case 5: // 未读数响应
                    handleLoopUnreadResp(resp);
                    break;
            }
        }
    }
};

/**
 * 发生异常后，重新连接服务端. 没有对原来的websocket进行判断关闭，这里直接重连会不会造成重复的连接？
 * 如果是这样的话，init()直接调用这里复用不是更好？
 * 
 * @returns
 */
function reconnect() {
    websocket = new WebSocket("ws://127.0.0.1:8080");
    $("#ws_status").text("重新上线");
    
    websocket.onmessage = function (event) {
        onmsg(event);
    };

    websocket.onopen = function () {
        bind();
        heartBeat.start();
    }

    websocket.onclose = function () {
        reconnect();
    };

    websocket.onerror = function () {
        reconnect();
    };
}

/**
 * 发送消息
 * 
 * @param event
 * @returns
 */
function sendMsg(event) {
    event.preventDefault();
    var recipient_id = $("#recipient_id").val();
    var msg_content = $("#message-text").val();
    var sender_id = $("#sender_id").val();
    $("#message-text").val("");
    var sendMsgJson = '{ "type": 3, "data": {"senderUid":' + sender_id + ',"recipientUid":' + recipient_id + ', "content":"' + msg_content + '","msgType":1  }}';
    websocket.send(sendMsgJson);
    return false;
}

/** 每2分钟发送一次心跳包，接收到消息或者服务端的响应又会重置来重新计时。 */
var heartBeat = {
    timeout: 120000,
    timeoutObj: null,
    serverTimeoutObj: null,
    // 接收到服务端的斜体消息时，重置心跳计时器
    reset: function () {
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeoutObj);
        this.start();
    },
    start: function () {
        var self = this;
        this.timeoutObj = setTimeout(function () {
            var sender_id = $("#sender_id").val();
            var sendMsgJson = '{ "type": 0, "data": {"uid":' + sender_id + ',"timeout": 120000}}';
            websocket.send(sendMsgJson); // 发送心跳包
            
            // 在发送心跳包之后，启动超时器，如果2分钟没收到服务端的消息则关闭连接
            self.serverTimeoutObj = setTimeout(function () {
                websocket.close(); // 关闭连接
                $("#ws_status").text("失去连接！");
            }, self.timeout)
        }, this.timeout) // 2分钟后发送一次心跳包
    },
}

// 轮询总未读
function queryUnread() {
    var ownerUid = $("#sender_id").val();
    var queryUnreadJson = '{ "type": 5, "data": {"uid":' + ownerUid + '}}';
    websocket.send(queryUnreadJson);
}

// 通过websocket长连来查询消息
function queryMsg(event) {
    $('.chat-thread').empty();
    $("#self-chat-li-style").remove();
    $("#other-chat-li-style").remove();
    
    // 获取接收人信息
    var button = $(event.relatedTarget);
    var recipient_id = button.data('recipient_id');
    var recipient_name = button.data('recipient_name');
    
    // 保存接收人信息到对话窗口
    var modal = $("#chatModal");
    modal.find('.modal-title').text('给' + recipient_name + '发送信息：');
    modal.find("#recipient_id").val(recipient_id);
    modal.find("#recipient_name").val(recipient_name);
    
    // 发送人 ID
    var sender_id = $("#sender_id").val();

    // 查询历史对话信息及未读数
    var queryMsgJson = '{ "type": 2, "data": {"ownerUid":' + sender_id + ',"otherUid":' + recipient_id + ' }}';
    websocket.send(queryMsgJson);

    var tbodyID = $(event.relatedTarget).parent().parent().parent().attr("id");
    if (tbodyID == "contactsBody") {
        $(event.relatedTarget).parent().prev().text(0);
    }

}

// 登录响应处理. 处理上线bind请求，主要是回显通知用户
function handleBindResp(resp) {
    var status = resp.status;
    if (status != "" && status == 'success') {
        $("#ws_status").text("上线成功!");
    } else {
        $("#ws_status").text("未上线!");
    }
}

// 处理查询消息的响应，界面联动
function handleQueryMsgResp(resp) {
    var jsonarray = resp.data;
    var sender_id = $("#sender_id").val();
    
    if (jsonarray != "") {
        var ul_pane = $('.chat-thread');
        var owner_uid_avatar, other_uid_avatar;
        
        // 遍历展示每一条历史消息
        $.each(jsonarray, function (i, msg) {
            var li_msg = $('<li></li>');//创建一个li
            var relation_type = msg.type;
            var owner_uid = msg.ownerUid;
            owner_uid_avatar = msg.ownerUidAvatar;
            other_uid_avatar = msg.otherUidAvatar;
            
            if ((relation_type == 0) && (owner_uid == sender_id)) { //自己发的
                li_msg.attr("id", "self-chat-li");
                li_msg.text(msg.content);
                li_msg.attr("mid", msg.mid);
                li_msg.attr("other_uid", msg.otherUid);
                li_msg.attr("create_time", msg.createTime);
                li_msg.attr("avatar", 'url(/images/' + owner_uid_avatar + ')');

            } else if ((relation_type == 1) && (owner_uid == sender_id)) {//别人发的
                li_msg.attr("id", "other-chat-li");
                li_msg.text(msg.content);
                li_msg.attr("mid", msg.mid);
                li_msg.attr("other_uid", msg.ownerUid);
                li_msg.attr("create_time", msg.createTime);
                li_msg.attr("avatar", 'url(/images/' + owner_uid_avatar + ')');
            }
            ul_pane.append(li_msg);

        });

        $("<style id='self-chat-li-style'>#self-chat-li:before{background-image:url('/images/" + owner_uid_avatar + "')}</style>").appendTo('head');
        $("<style id='other-chat-li-style'>#other-chat-li:before{background-image:url('/images/" + other_uid_avatar + "')}</style>").appendTo('head');
    }
}


// 处理发消息的发送方的响应
function handleSendMsgResp(resp) {
    var jsonContent = resp.data;
    var sender_avatar = $("#sender_avatar").val();
    var ul_pane = $('.chat-thread');
    var li_current = $('<li></li>');//创建一个li
    li_current.attr("id", "self-chat-li");
    li_current.text(jsonContent.content);
    li_current.attr("mid", jsonContent.mid);
    li_current.attr("other_uid", jsonContent.otherUid);
    li_current.attr("create_time", jsonContent.createTime);
    li_current.attr("avatar", 'url(/images/' + sender_avatar + ')');
    ul_pane.append(li_current);
    $('.chat-thread').animate({scrollTop: $('.chat-thread').prop("scrollHeight")}, 10);


    var currentContactsTR = $("#contactsBody tr");
    var flag1 = false;
    // 针对已在界面显示的会话，更新最近一条消息内容显示
    if (currentContactsTR) {
        $.each(currentContactsTR, function (i, contactTR) {
            var chat_uid = $(contactTR).attr("chat_uid");
            if (chat_uid == jsonContent.otherUid) {
                $(contactTR).children(":nth-child(3)").text(jsonContent.content); // 更新最近会话的最新内容
                flag1 = true;
            }
        });
    }

    // 如果未在界面上显示，则新增一条最近会话显示
    if (flag1 == false) {
        var td_images = "<td><img width='50px' src='/images/" + jsonContent.otherUidAvatar + "'/></td>";
        var td_otherName = "<td>" + jsonContent.otherName + "</td>";
        var td_content = "<td>" + jsonContent.content + "</td>";
        var td_convUnread = "<td>0</td>";
        var td_button = "<td><button type='button' class='btn btn-info' data-toggle='modal' data-target='#chatModal' data-recipient_id='" + jsonContent.otherUid + "' data-recipient_name='" + jsonContent.otherName + "'>和他聊天</button></td>";
        var tr_html = "<tr chat_uid='" + jsonContent.otherUid + "'>" + td_images + td_otherName + td_content + td_convUnread + td_button + "</tr>";
        $("#contactsBody").prepend(tr_html);
    }
}

// 处理接收到的推送消息，主要是最近联系人界面和聊天界面的展示
function handleReceivedMsg(pushedMsg) {
    var jsonRecipient = pushedMsg.data;
    var tid = pushedMsg.tid;
    
    // 接收到服务端消息后返回ACK
    if (tid != "") {
        var ackJson = '{ "type": 6, "data": {"tid":' + tid + ' }}';
        websocket.send(ackJson);
    }
    
    var ul_pane = $('.chat-thread');
    var li_current = $('<li></li>');//创建一个li
    var flag2 = false;
    li_current.attr("id", "other-chat-li");
    li_current.text(jsonRecipient.content);
    li_current.attr("mid", jsonRecipient.mid);
    li_current.attr("other_uid", jsonRecipient.ownerUid);
    li_current.attr("create_time", jsonRecipient.createTime);
    li_current.attr("avatar", 'url(/images/' + jsonRecipient.ownerUidAvatar + ')');
    ul_pane.append(li_current);
    $('.chat-thread').animate({scrollTop: $('.chat-thread').prop("scrollHeight")}, 10);

    var currentContactsTR = $("#contactsBody tr");
    // 更新已显示的最近联系人的最后一条消息内容
    $.each(currentContactsTR, function (i, contactTR) {
        var chat_uid = $(contactTR).attr("chat_uid");
        if (chat_uid == jsonRecipient.ownerUid) {
            $(contactTR).children(":nth-child(3)").text(jsonRecipient.content);
            var unread = parseInt($(contactTR).children(":nth-child(4)").text());
            $(contactTR).children(":nth-child(4)").text(unread + 1);
            flag2 = true;
        }
    });

    // 如果界面未显示该最近联系人会话，只添加一条记录
    if (flag2 == false) {
        var td_images = "<td><img width='50px' src='/images/" + jsonRecipient.ownerUidAvatar + "'/></td>";
        var td_otherName = "<td>" + jsonRecipient.ownerName + "</td>";
        var td_content = "<td>" + jsonRecipient.content + "</td>";
        var td_convUnread = "<td>1</td>";
        var td_button = "<td><button type='button' class='btn btn-info' data-toggle='modal' data-target='#chatModal' data-recipient_id='" + jsonRecipient.ownerUid + "' data-recipient_name='" + jsonRecipient.ownerName + "'>和他聊天</button></td>";
        var tr_html = "<tr chat_uid='" + jsonRecipient.ownerUid + "'>" + td_images + td_otherName + td_content + td_convUnread + td_button + "</tr>";
        $("#contactsBody").prepend(tr_html);
    }

}

// 处理轮询总未读的响应
function handleLoopUnreadResp(resp) {
    var totalUnreadData = resp.data;
    $("#totalUnread").text(totalUnreadData.unread);
}



