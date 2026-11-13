-- The About block of the contact page as one set of rows. `children` is a JSON
-- array of contact ids.
CREATE VIEW contact_about AS
  SELECT contacts.id AS id,
         contacts.significant_other_id AS significant_other_id,
         contacts.how_met AS how_met,
         contacts.work AS work,
         contacts.food_preferences AS food_preferences,
         (SELECT json_group_array(child_id) FROM contact_children WHERE contact_children.parent_id = contacts.id) AS children
    FROM contacts;

-- Saving About is one UPDATE on the view, so the contact row and the children
-- succeed or fail together.
CREATE TRIGGER contact_about_update
INSTEAD OF UPDATE ON contact_about
BEGIN
  UPDATE contacts
     SET significant_other_id = NEW.significant_other_id,
         how_met = NEW.how_met,
         work = NEW.work,
         food_preferences = NEW.food_preferences
   WHERE id = OLD.id;

  DELETE FROM contact_children WHERE parent_id = OLD.id;

  INSERT INTO contact_children (parent_id, child_id)
  SELECT OLD.id, value FROM json_each(NEW.children);
END;
