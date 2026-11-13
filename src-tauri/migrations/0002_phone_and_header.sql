-- A contact has one phone number with no label. The first number of each
-- contact (the lowest id) moves onto the contact row and the table goes.
ALTER TABLE contacts ADD COLUMN phone TEXT;

UPDATE contacts
   SET phone = (
     SELECT number FROM phone_numbers
      WHERE phone_numbers.contact_id = contacts.id
      ORDER BY phone_numbers.id
      LIMIT 1
   );

DROP TABLE phone_numbers;

-- The contact page header as one set of rows. `tags` is a JSON array.
CREATE VIEW contact_header AS
  SELECT contacts.id AS id,
         contacts.category AS category,
         contacts.first_name AS first_name,
         contacts.last_name AS last_name,
         contacts.email AS email,
         contacts.phone AS phone,
         contacts.birthday AS birthday,
         contacts.picture AS picture,
         (SELECT json_group_array(tag) FROM contact_tags WHERE contact_tags.contact_id = contacts.id) AS tags
    FROM contacts;

-- Saving the header is one UPDATE on the view, so the contact row and the tags
-- succeed or fail together. A column the UPDATE does not name keeps its value.
CREATE TRIGGER contact_header_update
INSTEAD OF UPDATE ON contact_header
BEGIN
  UPDATE contacts
     SET category = NEW.category,
         first_name = NEW.first_name,
         last_name = NEW.last_name,
         email = NEW.email,
         phone = NEW.phone,
         birthday = NEW.birthday,
         picture = NEW.picture
   WHERE id = OLD.id;

  DELETE FROM contact_tags WHERE contact_id = OLD.id;

  INSERT OR IGNORE INTO contact_tags (contact_id, tag)
  SELECT OLD.id, value FROM json_each(NEW.tags);
END;
