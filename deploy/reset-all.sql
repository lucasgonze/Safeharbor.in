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
create table acct ( acctid serial unique,
	email text not null unique,
	password text not null, 
	resetSecret text, 
	role text not null, 
	autologin integer not null default 0, 
	resetDate timestamp 
) with oids;
create table site (  acct integer not null, 
	siteid serial unique, 
	sitename text not null, 
	sitelogo text, 
	domain text not null unique, 
	agentaddress text not null, 
	agentemail text not null,
	agentname text not null,
	agentphone text not null
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
	description text not null
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

insert into acct (role,email,password) values ('1','lucas@gonze.com', 'abcd');

insert into site (siteid,acct,sitename,domain,sitelogo,agentaddress,agentemail,agentname,agentphone) 
	values (40,1,'Etsy','1.etsy.com','/img/etsy.png','1 Infinite Hype Way\nPalo Alot CA 12345',
         	'lucas@gonze.com','Jane Doe Esquire','(800) 555-1212');

insert into audit (site, opname) values (1,'takedownRequest');

insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');
insert into media (anchor, audit,description,media_url,page) values (  'Next to the header titled "The Beatles"', 9, '"Abby Rode" by The Bztles',  'http://example.com/abbyrode.mp3', 'http://example.com');

