package geektime.im.lecture.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import geektime.im.lecture.entity.ContactMultiKeys;
import geektime.im.lecture.entity.MessageContact;

@Repository
public interface MessageContactRepository extends JpaRepository<MessageContact, ContactMultiKeys> {

    public List<MessageContact> findMessageContactsByOwnerUidOrderByMidDesc(Long ownerUid);
}
