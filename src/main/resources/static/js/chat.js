/**
 * 发送聊天信息
 * 
 * @param event
 * @returns
 */
function sendMsg(event) {
    event.preventDefault();
    var recipient_id = $("#recipient_id").val(); // 接收人ID
    var msg_content = $("#message-text").val(); // 输入框的内容
    var sender_id = $("#sender_id").val(); // 发送人id
    var sender_avatar = $("#sender_avatar").val(); // 发送人头像
    var send_time;
    // 清空输入框
    $("#message-text").val("");
    var new_mid;
    
    $.post(
        '/sendMsg',
        {
            senderUid: sender_id,
            recipientUid: recipient_id,
            content: msg_content,
            msgType: 1
        },
        function (returnContent) {
            var jsonContent = $.parseJSON(returnContent);
            send_time = jsonContent.createTime;
            new_mid = jsonContent.mid;
            var ul_pane = $('.chat-thread');
            var li_current = $('<li></li>');//创建一个li
            li_current.attr("id", "self-chat-li");
            li_current.text(msg_content);
            li_current.attr("mid", new_mid);
            li_current.attr("other_uid", recipient_id);
            li_current.attr("create_time", send_time);
            li_current.attr("avatar", 'url(/images/' + sender_avatar + ')');
            ul_pane.append(li_current);
            $('.chat-thread').animate({scrollTop: $('.chat-thread').prop("scrollHeight")}, 10);
            return false;
        }
    );
    return false;
}

/**
 * 查询新的聊天消息并追加到现有聊天窗口中展示
 * 
 * @returns
 */
function queryNewcomingMsg() {

    var lastMid = $('.chat-thread li:last-child').attr("mid"); // 对话的最后一条消息ID
    var ownerUid = $("#sender_id").val();
    var otherUid = $('.chat-thread li:last-child').attr("other_uid");

    $.get(
        '/queryMsgSinceMid',
        {
            ownerUid: ownerUid,
            otherUid: otherUid,
            lastMid: lastMid
        },
        function (msgsJson) {
            if (msgsJson != "") {
                var jsonarray = $.parseJSON(msgsJson);
                var ul_pane = $('.chat-thread');
                var owner_uid_avatar, other_uid_avatar;
                
                $.each(jsonarray, function (i, msg) {
                    var relation_type = msg.type;
                    owner_uid_avatar = msg.ownerUidAvatar;
                    other_uid_avatar = msg.otherUidAvatar;

                    var ul_pane = $('.chat-thread');
                    var li_current = $('<li></li>');//创建一个li

                    li_current.text(msg.content);
                    li_current.attr("mid", msg.mid);
                    li_current.attr("other_uid", msg.otherUid);
                    li_current.attr("create_time", msg.createTime);

                    if ((relation_type == 0) && (msg.ownerUid == ownerUid)) { //自己发的
                        li_current.attr("id", "self-chat-li");
                        li_current.attr("avatar", 'url(/images/' + sender_avatar + ')');

                    } else if ((relation_type == 1) && (msg.ownerUid == ownerUid)) {//别人发的
                        li_current.attr("id", "other-chat-li");
                        li_current.attr("avatar", 'url(/images/' + other_uid_avatar + ')');
                    }

                    ul_pane.append(li_current);
                    $('.chat-thread').animate({scrollTop: $('.chat-thread').prop("scrollHeight")}, 10);

                });
            }
        }
    );
}

/**
 * 查询最近会话和未读数
 * 
 * @returns
 */
function queryContactsAndUnread() {

    $.get(
        '/queryContacts',
        {
            ownerUid: $("#sender_id").val()
        },
        function (returnContacts) {
            if (returnContacts != "") {
                var jsonContacts = $.parseJSON(returnContacts);
                $("#totalUnread").text(jsonContacts.totalUnread); // 更新总未读数
                var contactsTR = "";
                // 循环构造最近会话列表的table行
                $.each(jsonContacts.contactInfoList, function (index, contactInfo) {
                    var td_images = "<td><img width='50px' src='/images/" + contactInfo.otherAvatar + "'/></td>";
                    var td_otherName = "<td>" + contactInfo.otherName + "</td>";
                    var td_content = "<td>" + contactInfo.content + "</td>";
                    var td_convUnread = "<td>" + contactInfo.convUnread + "</td>";
                    var td_button = "<td><button type='button' class='btn btn-info' data-toggle='modal' data-target='#chatModal' data-recipient_id='" + contactInfo.otherUid + "' data-recipient_name='" + contactInfo.otherName + "'>和他聊天</button></td>";
                    var tr_html = "<tr>" + td_images + td_otherName + td_content + td_convUnread + td_button + "</tr>";
                    contactsTR += tr_html;
                });
                $("#contactsBody").html(contactsTR); // 替换最近会话列表
            }
        }
    );
}

/**
 * 查询历史对话消息
 * 
 * @param event
 * @returns
 */
function queryMsg(event) {
    $('.chat-thread').empty();
    $("#self-chat-li-style").remove();
    $("#other-chat-li-style").remove();
    
    // 获取接收人信息
    var button = $(event.relatedTarget); // 获取点击的按钮对象
    var recipient_id = button.data('recipient_id'); // 点击的时候，带上接收人的ID和名称
    var recipient_name = button.data('recipient_name'); // 点击的时候，带上接收人的ID和名称
    
    // 保存接收人信息到对话窗口
    var modal = $("#chatModal");
    modal.find('.modal-title').text('给' + recipient_name + '发送信息：'); // 对话窗口顶部标题
    modal.find("#recipient_id").val(recipient_id); // 对话窗口中保存接收人ID和名称
    modal.find("#recipient_name").val(recipient_name); // 对话窗口中保存接收人ID和名称
    
    // 发送人 ID
    var sender_id = $("#sender_id").val();
    
    $.get(
        '/queryMsg', // 查询历史对话信息，更新未读数
        {
            ownerUid: sender_id,
            otherUid: recipient_id
        },
        function (msgsJson) {
            if (msgsJson != "") {
                var jsonarray = $.parseJSON(msgsJson);
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
                        li_msg.appendTo(ul_pane);

                    } else if ((relation_type == 1) && (owner_uid == sender_id)) {//别人发的
                        li_msg.attr("id", "other-chat-li");
                        li_msg.text(msg.content);
                        li_msg.attr("mid", msg.mid);
                        li_msg.attr("other_uid", msg.otherUid);
                        li_msg.attr("create_time", msg.createTime);
                        li_msg.attr("avatar", 'url(/images/' + other_uid_avatar + ')');
                        li_msg.appendTo(ul_pane);
                    }
                    ul_pane.append(li_msg);

                });

                $("<style id='self-chat-li-style'>#self-chat-li:before{background-image:url('/images/" + owner_uid_avatar + "')}</style>").appendTo('head');
                $("<style id='other-chat-li-style'>#other-chat-li:before{background-image:url('/images/" + other_uid_avatar + "')}</style>").appendTo('head');
            }
        }

    );

    // 定时刷新新的聊天信息
    newMsgLoop = setInterval(queryNewcomingMsg, 3000);
}