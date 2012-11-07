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
