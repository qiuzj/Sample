package geektime.im.lecture.vo;

import java.util.Date;

/**
 * 用户在对话窗口中展示的每一条消息.
 * 
 * @author Binary life
 *
 */
public class MessageVO {
	private Long mid; // 消息ID
    private String content; // 消息内容
    private Long ownerUid; // 消息拥有者ID
    private Integer type; // 消息类型. 发件箱还是收件箱
    private Long otherUid; // 消息接收者ID
    private Date createTime; // 创建时间
    private String ownerUidAvatar; // 消息拥有者头像
    private String otherUidAvatar; // 消息接收者头像
    private String ownerName; // 拥有者名称
    private String otherName; // 接收者名称

    public String getOwnerName() {
        return ownerName;
    }

    public String getOtherName() {
        return otherName;
    }

    public MessageVO(Long mid, String content, Long ownerUid, Integer type, Long otherUid, Date createTime, String ownerUidAvatar, String otherUidAvatar, String ownerName, String otherName) {
        this.mid = mid;
        this.content = content;
        this.ownerUid = ownerUid;
        this.type = type;
        this.otherUid = otherUid;
        this.createTime = createTime;
        this.ownerUidAvatar = ownerUidAvatar;
        this.otherUidAvatar = otherUidAvatar;
        this.ownerName = ownerName;
        this.otherName = otherName;
    }

    public Long getMid() {
        return mid;
    }

    public String getContent() {
        return content;
    }

    public Long getOwnerUid() {
        return ownerUid;
    }

    public Integer getType() {
        return type;
    }

    public Long getOtherUid() {
        return otherUid;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public String getOwnerUidAvatar() {
        return ownerUidAvatar;
    }

    public String getOtherUidAvatar() {
        return otherUidAvatar;
    }
}
