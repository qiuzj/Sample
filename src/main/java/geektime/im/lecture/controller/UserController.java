package geektime.im.lecture.controller;

import java.util.List;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import geektime.im.lecture.Constants;
import geektime.im.lecture.entity.User;
import geektime.im.lecture.exceptions.InvalidUserInfoException;
import geektime.im.lecture.exceptions.UserNotExistException;
import geektime.im.lecture.service.UserService;
import geektime.im.lecture.vo.MessageContactVO;

@Controller
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping(path = "/")
    public String welcomePage(@RequestParam(name = "username", required = false)
                                      String username, HttpSession session) {
        if (session.getAttribute(Constants.SESSION_KEY) != null) {
            return "index"; // 首页
        } else {
            return "login"; // 登录页
        }
    }

    /**
     * 登录
     * 
     * @param email
     * @param password
     * @param model
     * @param session
     * @return
     */
    @RequestMapping(path = "/login")
    public String login(@RequestParam String email, @RequestParam String password, Model model, HttpSession session) {
        try {
            User loginUser = userService.login(email, password); // 登录认证
            model.addAttribute("loginUser", loginUser); // 返回当前用户
            session.setAttribute(Constants.SESSION_KEY, loginUser); // 保存到会话

            List<User> otherUsers = userService.getAllUsersExcept(loginUser); // 获取非当前用户的所有用户信息
            model.addAttribute("otherUsers", otherUsers); // 返回其他用户

            MessageContactVO contactVO = userService.getContacts(loginUser); // 获取所有会话信息及未读数
            model.addAttribute("contactVO", contactVO); // 返回会话信息
            return "index";
        } catch (UserNotExistException e1) {
            model.addAttribute("errormsg", email + ": 该用户不存在！");
            return "login";
        } catch (InvalidUserInfoException e2) {
            model.addAttribute("errormsg", "密码输入错误！");
            return "login";
        }
    }

    /**
     * WebSocket页面
     * 
     * @param model
     * @param session
     * @return
     */
    @RequestMapping(path = "/ws")
    public String ws(Model model, HttpSession session) {
        User loginUser = (User)session.getAttribute(Constants.SESSION_KEY);
        model.addAttribute("loginUser", loginUser);
        List<User> otherUsers = userService.getAllUsersExcept(loginUser);
        model.addAttribute("otherUsers", otherUsers);

        MessageContactVO contactVO = userService.getContacts(loginUser);
        model.addAttribute("contactVO", contactVO);
        return "index_ws";
    }

    /**
     * 退出
     * 
     * @param session
     * @return
     */
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        // 移除session
        session.removeAttribute(Constants.SESSION_KEY);
        return "redirect:/";
    }

}