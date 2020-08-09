package geektime.im.lecture.controller;

import java.util.List;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import geektime.im.lecture.service.MessageService;
import geektime.im.lecture.vo.MessageContactVO;
import geektime.im.lecture.vo.MessageVO;

@Controller
public class MessageController {

    @Autowired
    private MessageService messageService;

    /**
     * 发送消息
     * 
     * @param senderUid
     * @param recipientUid
     * @param content
     * @param msgType
     * @param model
     * @param session
     * @return
     */
    @PostMapping(path = "/sendMsg")
    @ResponseBody
    public String sendMsg(@RequestParam Long senderUid, @RequestParam Long recipientUid, String content, Integer msgType, Model model, HttpSession session) {
        MessageVO messageContent = messageService.sendNewMsg(senderUid, recipientUid, content, msgType);
        if (null != messageContent) {
            return JSONObject.toJSONString(messageContent);
        } else {
            return "";
        }
    }

    /**
     * 查询历史对话信息，更新未读数
     * 
     * @param ownerUid
     * @param otherUid
     * @param model
     * @param session
     * @return
     */
    @GetMapping(path = "/queryMsg")
    @ResponseBody
    public String queryMsg(@RequestParam Long ownerUid, @RequestParam Long otherUid, Model model, HttpSession session) {
        List<MessageVO> messageVO = messageService.queryConversationMsg(ownerUid, otherUid);
        if (messageVO != null) {
            return JSONArray.toJSONString(messageVO);
        } else {
            return "";
        }
    }

    /**
     * 查询新的聊天消息
     * 
     * @param ownerUid
     * @param otherUid
     * @param lastMid
     * @param model
     * @param session
     * @return
     */
    @GetMapping(path = "/queryMsgSinceMid")
    @ResponseBody
    public String queryMsgSinceMid(@RequestParam Long ownerUid, @RequestParam Long otherUid, @RequestParam Long lastMid, Model model, HttpSession session) {
        List<MessageVO> messageVO = messageService.queryNewerMsgFrom(ownerUid, otherUid, lastMid);
        if (messageVO != null) {
            return JSONArray.toJSONString(messageVO);
        } else {
            return "";
        }
    }

    /**
     * 查询最近会话及未读数
     * 
     * @param ownerUid
     * @param model
     * @param session
     * @return
     */
    @GetMapping(path = "/queryContacts")
    @ResponseBody
    public String queryContacts(@RequestParam Long ownerUid, Model model, HttpSession session) {
        MessageContactVO contactVO = messageService.queryContacts(ownerUid);
        if (contactVO != null) {
            return JSONObject.toJSONString(contactVO);
        } else {
            return "";
        }
    }
}
