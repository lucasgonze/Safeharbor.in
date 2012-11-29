-- clear and reinit DB 
-- WARNING: extremely destructive

-- delete old tables
drop table if exists acct;
drop table if exists audit;
drop table if exists site;
drop table if exists contact;
drop table if exists media;
drop table if exists emailHandshake;
drop table if exists resets;

-- create new tables
create table acct ( 
	acctid serial unique,
	email text not null unique,
	password text not null, 
	resetSecret text, 
	role text not null, 
	resetDate timestamp 
) with oids;
create table site (  acct integer not null, 
	siteid serial unique, 
	sitename text not null, 
	sitelogo text, 
	domain text not null unique, 
	country text not null,
	agentaddress text not null, 
	agentemail text not null,
	agentname text not null,
	agentphone text not null,
	agentfax text not null
) with oids;
create table contact ( 
	contactid serial unique, 
	owners_full_name text not null, 
	full_name text not null, 
	job_title text not null, 
	email text not null, 
	phone text not null, 
	fax text not null, 
	postal text not null, 
	signature text not null 
);
create table audit (  
	auditid serial unique, 
	site integer not null, 
	contact integer not null default 0, 
	opname text not null, 
	attachment text not null default '', 
	creation timestamp DEFAULT current_timestamp
);
create table media (  
	mediaid serial unique, 
	audit integer not null, 
	page text not null, 
	media_url text not null, 
	anchor text not null, 
	description text not null,
	takedown_date timestamp with time zone
);
create table emailHandshake (
	creation timestamp DEFAULT current_timestamp,
	regid serial, 
	email text not null,
	password text not null
) with oids;
create table resets (
	ts timestamp,
	userid integer not null,
	secret text not null
);


-- create default accounts
-- this user has only one site
insert into acct (acctid,role,email,password) values (1,'1','lucas@gonze.com', 'abcd'); 
-- this user has more than one site
insert into acct (acctid,role,email,password) values (2,'1','lucas.gonze@gmail.com', 'abcd'); 

-- we only test admin role and logged_in role. Other roles are being phased out.
-- this user has a admin account (for testing roles)
insert into acct (acctid,role,email,password) values (3,'2','adminuser@safeharbor.in', 'abcd'); 
-- this user has a logged in account (for testing roles)
insert into acct (acctid,role,email,password) values (4,'21','loggedinuser@safeharbor.in', 'abcd'); 

-- only for demo - not for testing (user ID 5)
insert into acct (acctid,role,email,password) values (5,'21','demo@safeharbor.in', 'abcd'); 

-- only for testing - user ID 6
insert into acct (acctid,role,email,password) values (6,'21','testers@safeharbor.in', 'abcd'); 

-- for zendesk hacking - user ID 7
insert into acct (acctid,role,email,password) values (7,'1','support@safeharbor.zendesk.com', 'abcd'); 

-- for the user with one site
insert into site (siteid,acct,sitename,domain,sitelogo,agentaddress,agentemail,agentname,agentphone,country,agentfax) 
	values (1,1,'Etsy','1.etsy.com','http://latest.safeharbor.in/img/etsy.png','1 Infinite Hype Way\nPalo Alot CA 12345',
         	'lucas@gonze.com','Jane Doe Esquire','(800) 555-1212','Swaziland','(666) 666-6666');
-- for the user with two sites
insert into site (siteid,acct,sitename,domain,agentaddress,agentemail,agentname,agentphone,country,agentfax) 
	      values (2,2,'Example.com #1','1.example.com','123 Main St\nPalo Alot CA 12345',
         	'lucas@gonze.com','Jane Doe Esquire','(800) 555-1212','Canada','(666) 666-6666');
insert into site (siteid,acct,sitename,domain,agentaddress,agentemail,agentname,agentphone,country,agentfax) 
	values (3,2,'Example.com #2','2.example.com','456 Central St\nPalo Alot CA 12345',
        	'lucas@gonze.com','Jane Doe Esquire','(800) 555-1212','United States','(666) 666-6666');
-- for the demo user (siteid 4)
insert into site (siteid,acct,sitename,domain,sitelogo,agentaddress,agentemail,agentname,agentphone,country,agentfax) 
	values (4,5,'Etsy','etsy.com','http://latest.safeharbor.in/img/etsy.png','1 Infinite Hype Way\nPalo Alot CA 12345',
		'lucasgonze@safeharbor.in','Jane Doe Esquire','(800) 555-1212','United States','(666) 666-6666');
-- for the QA user (siteid 5)
insert into site (siteid,acct,sitename,domain,sitelogo,agentaddress,agentemail,agentname,agentphone,country,agentfax) 
	values (5,6,'Etsy','testdomain.safeharbor.in','http://latest.safeharbor.in/img/etsy.png','1 Infinite Hype Way\nPalo Alot CA 12345',
		'testers@safeharbor.in','Jane Doe Esquire','(800) 555-1212','United States','(666) 666-6666');
-- for working with Zendesk (siteid 6)
insert into site (siteid,acct,sitename,domain,sitelogo,agentaddress,agentemail,agentname,agentphone,country,agentfax) 
	values (6,7,'Etsy','safeharbor.zendesk.com','data:image/jpeg;base64,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','1 Infinite Hype Way\nPalo Alot CA 12345',
		'support@safeharbor.zendesk.com','Jane Doe Esquire','(800) 555-1212','United States','(666) 666-6666');

-- user with one site
insert into audit (site, opname, contact) values (1,'takedownRequest',1);

-- create a takedown request with a later date for testing date sort
insert into audit (site, opname, contact) values (1,'takedownRequest',1);
update audit set creation = now()+interval '1000 seconds' where auditid = 2;
insert into media (anchor, audit,description,media_url,page) values (  'In the blogroll', 2, '(This item is newer)',  'http://example.com/abbyrode.mp3', 'http://example.com');	
	
-- user with two sites
insert into audit (site, opname, contact) values (2,'takedownRequest',2);
insert into audit (site, opname, contact) values (3,'takedownRequest',2);
-- demo user
insert into audit (site, opname, contact) values (4,'takedownRequest',5);

-- user with one site
insert into contact (owners_full_name,full_name,job_title,email,phone,fax,postal,signature) 
	values ( 'John Q. Owner', 'Jane Workerbee', 'Attack Dog In Chief', 'jane@example.com', '(900) 555-1212', '(900) 555-1212', '456 Pleasant Valley Avenue, Agrestik CA 12345', '/jane w.');
-- user with two sites
insert into contact (owners_full_name,full_name,job_title,email,phone,fax,postal,signature) 
	values ( 'John Q. Owner', 'Jane Workerbee', 'Attack Dog In Chief', 'jane@example.com', '(900) 555-1212', '(900) 555-1212', '456 Pleasant Valley Avenue, Agrestik CA 12345', '/jane w.');
-- demo user
insert into contact (owners_full_name,full_name,job_title,email,phone,fax,postal,signature) values ( 'John Q. Owner', 'Jane Workerbee', 'Attack Dog In Chief', 'jane@example.com', '(900) 555-1212', '(900) 555-1212', '456 Pleasant Valley Avenue, Agrestik CA 12345', '/jane w.');

-- for the user with only one site
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 1, '"Oh Darlene" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Below to the header titled "The Beatles"', 1, '"Kind Mr Mustard" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 1, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 1, '"I Want to Hold Your Schnozzle" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 1, '"Noterday" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 1, '"Y Dont We Dew Et En Th Rod" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'On to the header titled "The Beatles"', 1, '"Abby Rode" by The Beetles',  'http://example.com/my-name-is-norbert.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 1, '"Abby Rode" by The Feebles',  'http://example.com/abbyrode.mp3', 'http://google.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 1, '"Abby Rode" by The Bagles',  'http://example.com/abbyrode.mp3', 'http://example.com');
	
-- warning: this line will be executed in a later script
-- insert into media (anchor, audit,description,media_url,page) values (  '(This item has a later date)"', 2, '(This item has a later date)',  'http://example.com/abbyrode.mp3', 'http://example.com');

-- a closed item for the user with only one site
insert into media (anchor, audit,description,media_url,page,takedown_date) values (  'In the blogroll', 1, '"Starz A Poppin!" by Hairosmith',  'http://example.com/abbyrode.mp3', 'http://example.com', current_timestamp);

-- for the user with more than one site
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 3, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 4, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');

-- for demo user
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 5, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
