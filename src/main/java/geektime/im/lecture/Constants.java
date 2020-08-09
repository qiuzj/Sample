package geektime.im.lecture;

public class Constants {
    public static final String SESSION_KEY = "user";

    /** 会话未读数Redis Key后缀 */
    public static final String CONVERSION_UNREAD_SUFFIX = "_C";
    /** 总未读数Redis Key后缀 */
    public static final String TOTAL_UNREAD_SUFFIX = "_T";

    public static final String WEBSOCKET_MSG_TOPIC = "websocket:msg";
}
