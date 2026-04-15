/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.5-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: second_brain
-- ------------------------------------------------------
-- Server version	11.8.5-MariaDB-ubu2404

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `ai_cache`
--

DROP TABLE IF EXISTS `ai_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_cache` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `hash` varchar(255) NOT NULL,
  `task_text` text NOT NULL,
  `maslow` varchar(255) DEFAULT NULL,
  `impact` int(11) DEFAULT NULL,
  `effort` int(11) DEFAULT NULL,
  `subtasks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`subtasks`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ai_cache_hash_unique` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_cache`
--

LOCK TABLES `ai_cache` WRITE;
/*!40000 ALTER TABLE `ai_cache` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `ai_cache` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(255) NOT NULL,
  `entity_id` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `session_id` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `daily_states`
--

DROP TABLE IF EXISTS `daily_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_states` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `energy` int(11) NOT NULL DEFAULT 5,
  `mood` int(11) NOT NULL DEFAULT 5,
  `focus` int(11) NOT NULL DEFAULT 5,
  `available_time` int(11) NOT NULL DEFAULT 120,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `daily_states_date_unique` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_states`
--

LOCK TABLES `daily_states` WRITE;
/*!40000 ALTER TABLE `daily_states` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `daily_states` VALUES
(1,'2026-03-26',7,7,8,120,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(2,'2026-03-27',9,9,9,120,'Energitic','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(3,'2026-03-28',9,9,9,120,'Energitic','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(4,'2026-03-29',10,10,10,120,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(5,'2026-03-30',5,5,5,360,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(6,'2026-03-31',5,5,5,120,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(7,'2026-04-01',3,3,3,120,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(8,'2026-04-02',5,5,5,120,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(9,'2026-04-03',10,10,10,120,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(10,'2026-04-05',4,8,7,240,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(11,'2026-04-06',2,10,2,30,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(12,'2026-04-08',10,10,10,120,'','2026-04-09 06:54:18','2026-04-09 06:54:18'),
(13,'2026-04-09',7,7,7,120,'','2026-04-09 07:33:39','2026-04-09 07:33:39'),
(14,'2026-04-10',3,3,3,120,'','2026-04-10 06:05:34','2026-04-10 06:05:34');
/*!40000 ALTER TABLE `daily_states` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `migrations` VALUES
(1,'2024_01_01_000001_create_users_table',1),
(2,'2024_01_01_000002_create_projects_table',1),
(3,'2024_01_01_000003_create_tasks_table',1),
(4,'2024_01_01_000004_create_daily_states_table',1),
(5,'2024_01_01_000005_create_supporting_tables',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `personal_access_tokens` VALUES
(26,'App\\Models\\User',1,'auth_token','1ff41343ac0881aaa68407c697c8c5edf1abb4e06c3d7ea1ddf2ddcc3548b552','[\"*\"]','2026-04-10 06:55:37',NULL,'2026-04-10 06:05:18','2026-04-10 06:55:37');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `profiles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `work_type` varchar(255) DEFAULT NULL,
  `routine_type` varchar(255) DEFAULT NULL,
  `commute_time` varchar(255) DEFAULT NULL,
  `use_personal_data` tinyint(1) NOT NULL DEFAULT 0,
  `age` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `financial_status` varchar(255) DEFAULT NULL,
  `health_status` varchar(255) DEFAULT NULL,
  `custom_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `profiles` VALUES
(1,'Shaik Khaja Mynuddin','Full-Time','Morning Person','1 hour',1,'43','1982-05-08','Critical','Poor','CABG Done on 28-12-2023 and suffering from vasculities','2026-04-09 06:54:18','2026-04-09 06:54:18');
/*!40000 ALTER TABLE `profiles` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('Active','Completed','Archived','Deleted') NOT NULL DEFAULT 'Active',
  `priority` int(11) NOT NULL DEFAULT 0,
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `projects` VALUES
(1,'Healthy food habit','','Active',0,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18',NULL),
(2,'Build mobile app project','','Deleted',0,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18',NULL),
(3,'Redesign landing page','','Deleted',0,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18',NULL),
(4,'Cafe integration ideas','','Active',0,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18',NULL),
(5,'Wellness center planning','','Active',0,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18',NULL),
(6,'Establish partnerships with local health professionals','','Active',0,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18',NULL),
(7,'Create Employee One Applicate Video walk-through with voice over','','Active',0,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18',NULL),
(8,'Quran Fahmi App Design, Develop and Deployment High Priority dead line 05-04-2026','','Active',0,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18',NULL),
(9,'Design and Develop Counselling App with Store','','Active',0,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18',NULL),
(10,'Finalize the Second Brain AI App and Deploy to Khaja Mynuddin.com sub domain','','Active',0,NULL,'2026-04-09 08:26:09','2026-04-09 08:26:09',NULL),
(11,'I need to build a Office projects tracking app and deploy it immediately to track official projects','','Active',0,NULL,'2026-04-09 11:21:45','2026-04-09 11:21:45',NULL),
(12,'Check the Bajaj Personal Loan Outstanding and Close it bt taking loan from ICICI Bank','','Active',0,NULL,'2026-04-10 06:10:04','2026-04-10 06:10:04',NULL);
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'Task',
  `area` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `maslow` varchar(255) DEFAULT NULL,
  `impact` int(11) NOT NULL DEFAULT 0,
  `effort` int(11) NOT NULL DEFAULT 0,
  `time_estimate` varchar(255) DEFAULT NULL,
  `urgency` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `confidence` double NOT NULL DEFAULT 0,
  `priority` int(11) NOT NULL DEFAULT 0,
  `fit_score` double NOT NULL DEFAULT 0,
  `status` enum('Pending','Done','Deleted','Idea','Note') NOT NULL DEFAULT 'Pending',
  `source` varchar(255) DEFAULT NULL,
  `recurrence` enum('Daily','Weekly','Monthly','Yearly') DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_project_id_foreign` (`project_id`),
  CONSTRAINT `tasks_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `tasks` VALUES
(1,NULL,'Hire therapist for Wellness Center','Task','Business','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(2,NULL,'Improve sleep routine','Task','Health','','Physiological',9,3,'30 mins','Medium','Task',0.8,23,7,'Done','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(3,1,'Research healthy recipes','Task','Health','','Physiological',9,3,'30 mins','Medium','Task',0.8,23,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(4,1,'Create a weekly meal plan','Task','Health','','Self-Actualization',9,7,'2 hours','Low','Task',0.7,13,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(5,1,'Grocery shopping for ingredients','Task','Health','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(6,NULL,'Yoga practice','Task','Health','','Esteem',7,5,'30 mins','Medium','Task',0.7,14,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(7,1,'Prepare meals in advance','Task','Health','','Self-Actualization',5,4,'45 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(8,1,'Track daily food intake','Task','Health','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(9,NULL,'Start exercising','Task','Health','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(10,NULL,'Car repair','Task','Personal','','Safety',8,5,'30 mins','Medium','Task',0.8,18,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(11,NULL,'Fix bedroom mold','Task','Health','','Safety',8,5,'30 mins','Medium','Task',0.8,18,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(12,NULL,'Driving licence Renewal','Task','Personal','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(13,NULL,'Dental cleaning','Task','Health','','Safety',8,5,'30 mins','Medium','Task',0.8,18,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(14,NULL,'Clean AC filters weekly','Task','Personal','','Safety',8,5,'30 mins','Low','Task',0.8,16,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(15,NULL,'Client UX improvements','Task','Work','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(16,NULL,'Enroll in therapy certification','Task','Transition','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(17,2,'Define app requirements','Task','Work','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(18,NULL,'Study psychology basics','Task','Transition','','Esteem',7,5,'30 mins','Medium','Task',0.7,14,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(19,3,'Research design trends','Task','Work','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(20,3,'Create wireframes','Task','Work','','Self-Actualization',9,7,'2 hours','Medium','Task',0.7,15,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(21,2,'Design user interface','Task','Work','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(22,3,'Develop visual assets','Task','Work','','Self-Actualization',9,7,'2 hours','Medium','Task',0.7,15,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(23,2,'Develop backend services','Task','Work','','Self-Actualization',9,7,'2 hours','Medium','Task',1,15,10,'Done','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(24,2,'Implement frontend features','Task','Work','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(25,3,'Implement design in code','Task','Work','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(26,2,'Test the application','Task','Work','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(27,2,'Deploy the app','Task','Work','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(28,3,'Test landing page functionality','Task','Work','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(29,NULL,'Practice counseling techniques','Task','Transition','','Esteem',7,5,'30 mins','Medium','Task',0.7,14,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(30,NULL,'Read AI books','Task','Learning','','Esteem',7,5,'20 mins','Medium','Task',0.7,14,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(31,NULL,'Define business model','Task','Business','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(32,4,'Research current cafe trends','Task','Business','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(33,4,'Brainstorm integration ideas','Task','Business','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(34,4,'Evaluate feasibility of ideas','Task','Business','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(35,4,'Create a presentation for stakeholders','Task','Business','','Self-Actualization',9,7,'2 hours','Medium','Task',0.7,15,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(36,4,'Gather feedback from team members','Task','Business','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(37,5,'Conduct market research','Task','Business','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(38,5,'Develop a business plan','Task','Business','','Self-Actualization',9,7,'2 hours','Medium','Task',0.7,15,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(39,5,'Design the layout of the center','Task','Business','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(40,5,'Create a marketing strategy','Task','Business','','Self-Actualization',9,7,'2 hours','Medium','Task',0.7,15,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(41,5,'Establish partnerships with local health professionals','Task','Business','','Physiological',9,3,'30 mins','Medium','Task',0.8,23,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(42,NULL,'Complete tech course','Task','Learning','','Esteem',7,5,'30 mins','Medium','Task',0.7,14,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(43,NULL,'Pay electricity bill','Task','Personal','','Safety',8,2,'30 mins','Medium','Task',0.8,21,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(44,NULL,'Call family','Task','Social','','Love',7,2,'10 mins','Medium','Task',1,18,7,'Done','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(45,NULL,'Organize workspace','Task','Personal','','Safety',8,5,'30 mins','Medium','Task',0.8,18,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(46,NULL,'Meet friends','Task','Social','','Love',7,2,'30 mins','Medium','Task',1,18,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(47,NULL,'Brainstorm product ideas','Task','Creative','','Self-Actualization',9,7,'30 mins','Medium','Task',0.7,15,9,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(48,NULL,'Write design concepts','Task','Creative','','Esteem',7,6,'45 mins','Medium','Task',0.7,13,9,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(49,6,'Identify potential health professionals','Task','Business','','Physiological',9,3,'30 mins','Medium','Task',0.8,23,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(50,6,'Research their services and specialties','Task','Business','','Safety',8,5,'30 mins','Medium','Task',0.6,18,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(51,6,'Reach out to schedule meetings','Task','Business','','Love',6,2,'30 mins','Medium','Task',0.8,16,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(52,6,'Prepare partnership proposals','Task','Business','','Self-Actualization',5,4,'45 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(53,6,'Follow up on meetings','Task','Business','','Love',6,2,'30 mins','Medium','Task',0.8,16,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(54,NULL,'Electricity Bill Payment on 10th of every month','Task','Finance','','Safety',8,2,'30 mins','Medium','Task',0.8,21,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(55,NULL,'Call Sridhar Kadapa','Task','Finance','','Love',6,2,'10 mins','Medium','Task',0.8,16,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(56,NULL,'Call Amanulla Khan Sab','Task','Personal','','Love',6,2,'10 mins','Medium','Task',0.8,16,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(57,NULL,'Call Kumar Now','Task','Work','','Love',6,2,'10 mins','Medium','Task',0.8,16,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(58,NULL,'Pay monthly water bill on 2nd','Task','Personal','','Safety',8,2,'30 mins','Medium','Task',0.8,21,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(59,NULL,'Call Mujahid Akram on 2nd of every month','Task','Personal','','Love',6,2,'10 mins','Medium','Task',0.8,16,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(60,NULL,'Call Mujahid Akram on 2nd of every month','Task','Personal','','Love',6,2,'10 mins','Medium','Task',0.8,16,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(61,NULL,'nothing on my mind monthly 2nd','Task','Personal','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(62,NULL,'Call Moinuddin master monthly once','Task','Personal','','Love',6,2,'10 mins','Medium','Task',0.8,16,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(63,NULL,'Repair Sewing Machine','Task','Home','','Safety',8,5,'30 mins','Medium','Task',0.8,18,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(64,NULL,'Repair Mixer Grinder for Kitchen','Task','Home','','Safety',8,5,'30 mins','Medium','Task',0.8,18,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(65,7,'Outline the key features and sections of the Employee One application that need to be covered in the video.','Task','Work','','Esteem',7,6,'30 mins','Medium','Task',0.5,13,9,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(66,7,'Create a script for the voice-over, ensuring it aligns with the outlined features and is easy to understand.','Task','Work','','Self-Actualization',9,7,'2 hours','Medium','Task',0.5,15,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(67,7,'Record the voice-over using a clear and professional tone, ensuring good audio quality.','Task','Work','','Esteem',7,6,'30 mins','Medium','Task',0.5,13,9,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(68,7,'Capture screen recordings of the Employee One application, demonstrating each feature as per the script.','Task','Work','','Esteem',7,6,'30 mins','Medium','Task',0.5,13,9,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(69,7,'Edit the video by synchronizing the screen recordings with the voice-over and adding any necessary annotations or highlights.','Task','Work','','Esteem',7,6,'30 mins','Medium','Task',0.5,13,9,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(70,7,'Review the final video for clarity, accuracy, and overall quality before publishing or sharing.','Task','Work','','Esteem',7,6,'20 mins','Medium','Task',0.5,13,9,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(71,8,'Conduct user research to identify key features and functionalities for the Quran Fahmi App.','Task','Spiritual','','4',8,6,'30 mins','Medium','Task',0.95,14,9,'Pending','CACHE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(72,8,'Create wireframes and design prototypes for the app interface based on user feedback.','Task','Spiritual','','Self-Actualization',9,7,'2 hours','Medium','Task',0.5,15,10,'Done','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(73,8,'Develop the app using appropriate technology stack and integrate necessary features.','Task','Spiritual','','Self-Actualization',9,7,'2 hours','Medium','Task',0.5,15,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(74,8,'Conduct thorough testing (unit, integration, and user acceptance testing) to ensure app functionality and usability.','Task','Spiritual','','4',9,7,'30 mins','Medium','Task',0.95,15,9,'Pending','CACHE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(75,8,'Prepare marketing materials and a launch plan for the app deployment.','Task','Spiritual','','Self-Actualization',9,7,'45 mins','Medium','Task',0.5,15,9,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(76,8,'Deploy the app on relevant platforms and monitor user feedback for continuous improvement.','Task','Spiritual','','4',7,5,'30 mins','Medium','Task',0.95,13,7,'Pending','CACHE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(77,9,'Research user needs and market trends','Task','Finance','','3',6,5,'30 mins','Medium','Task',0.95,11,7,'Pending','CACHE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(78,9,'Create wireframes and design UI/UX','Task','Finance','','Self-Actualization',9,7,'2 hours','Medium','Task',0.5,15,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(79,9,'Develop backend functionality','Task','Finance','','Self-Actualization',9,7,'2 hours','Medium','Task',0.7,15,10,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(80,9,'Implement frontend features','Task','Finance','','Self-Actualization',5,4,'30 mins','Medium','Task',0.4,10,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(81,9,'Test the app for bugs and usability','Task','Finance','','3',8,6,'30 mins','Medium','Task',0.95,14,9,'Pending','CACHE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(82,9,'Launch the app on app stores','Task','Finance','','Self-Actualization',9,7,'30 mins','Medium','Task',0.7,15,9,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(83,NULL,'Iron box repair','Task','Home','','Safety',8,5,'30 mins','Medium','Task',0.8,18,7,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 06:54:18','2026-04-09 06:54:18'),
(84,10,'Break down the task','Task','Personal',NULL,'Self-Actualization',5,4,'30 mins','Medium',NULL,0,0,0,'Done','RULE',NULL,NULL,NULL,'2026-04-09 08:26:27','2026-04-09 08:26:09','2026-04-09 08:26:27'),
(85,10,'Execute step 1','Task','Personal',NULL,'Self-Actualization',5,4,'30 mins','Medium',NULL,0,0,0,'Done','RULE',NULL,NULL,NULL,'2026-04-09 08:26:30','2026-04-09 08:26:09','2026-04-09 08:26:30'),
(86,10,'Execute step 2','Task','Personal',NULL,'Self-Actualization',5,4,'30 mins','Medium',NULL,0,0,0,'Done','RULE',NULL,NULL,NULL,'2026-04-09 08:26:32','2026-04-09 08:26:09','2026-04-09 08:26:32'),
(87,10,'Complete and review','Task','Personal',NULL,'Self-Actualization',5,4,'20 mins','Medium',NULL,0,0,0,'Done','RULE',NULL,NULL,NULL,'2026-04-09 08:26:33','2026-04-09 08:26:09','2026-04-09 08:26:33'),
(88,11,'Define the key features and functionalities of the office projects tracking app.','Task','Work',NULL,'Self-Actualization',5,7,'1 hour','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 11:21:45','2026-04-09 11:21:45'),
(89,11,'Choose a technology stack for the app (e.g., frontend and backend frameworks, database).','Task','Work',NULL,'Self-Actualization',5,7,'2 hours','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 11:21:45','2026-04-09 11:21:45'),
(90,11,'Develop the app by creating the user interface and implementing the backend logic.','Task','Work',NULL,'Self-Actualization',9,7,'1 day','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 11:21:45','2026-04-09 11:21:45'),
(91,11,'Test the app for bugs and ensure all features work as intended.','Task','Work',NULL,'Self-Actualization',5,7,'1 hour','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 11:21:45','2026-04-09 11:21:45'),
(92,11,'Deploy the app to a cloud service or server for immediate access.','Task','Work',NULL,'Safety',8,7,'1 day','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 11:21:45','2026-04-09 11:21:45'),
(93,11,'Gather user feedback and make necessary adjustments or improvements.','Task','Work',NULL,'Self-Actualization',5,4,'1 hour','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-09 11:21:45','2026-04-09 11:21:45'),
(94,12,'Check Bajaj Personal Loan Outstanding','Task','Finance',NULL,'Self-Actualization',5,4,'20 mins','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-10 06:10:04','2026-04-10 06:10:04'),
(95,12,'Research ICICI Bank loan options','Task','Finance',NULL,'Self-Actualization',5,4,'30 mins','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-10 06:10:04','2026-04-10 06:10:04'),
(96,12,'Apply for ICICI Bank loan','Task','Finance',NULL,'Self-Actualization',5,4,'30 mins','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-10 06:10:04','2026-04-10 06:10:04'),
(97,12,'Close Bajaj Personal Loan','Task','Finance',NULL,'Self-Actualization',5,4,'30 mins','Medium',NULL,0,0,0,'Pending','RULE',NULL,NULL,NULL,NULL,'2026-04-10 06:10:04','2026-04-10 06:10:04');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `today_view`
--

DROP TABLE IF EXISTS `today_view`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `today_view` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint(20) unsigned NOT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  `fit_score` double NOT NULL DEFAULT 0,
  `category` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Done') NOT NULL DEFAULT 'Pending',
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `today_view_task_id_foreign` (`task_id`),
  CONSTRAINT `today_view_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `today_view`
--

LOCK TABLES `today_view` WRITE;
/*!40000 ALTER TABLE `today_view` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `today_view` VALUES
(1,3,23,7,'Critical','Pending','2026-04-09','2026-04-09 07:33:39','2026-04-09 07:33:39'),
(2,41,23,7,'Critical','Pending','2026-04-09','2026-04-09 07:33:39','2026-04-09 07:33:39'),
(3,49,23,7,'Critical','Pending','2026-04-09','2026-04-09 07:33:39','2026-04-09 07:33:39'),
(4,43,21,7,'Critical','Pending','2026-04-09','2026-04-09 07:33:39','2026-04-09 07:33:39'),
(5,3,23,7,'Critical (Reschedule or Delegate)','Pending','2026-04-10','2026-04-10 06:05:34','2026-04-10 06:05:34'),
(6,41,23,7,'Critical (Reschedule or Delegate)','Pending','2026-04-10','2026-04-10 06:05:34','2026-04-10 06:05:34'),
(7,49,23,7,'Critical (Reschedule or Delegate)','Pending','2026-04-10','2026-04-10 06:05:34','2026-04-10 06:05:34'),
(8,43,21,7,'Critical (Reschedule or Delegate)','Pending','2026-04-10','2026-04-10 06:05:34','2026-04-10 06:05:34');
/*!40000 ALTER TABLE `today_view` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','user') NOT NULL DEFAULT 'user',
  `avatar_url` varchar(255) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `users` VALUES
(1,'Admin','admin@secondbrain.ai','$2y$12$.7MWWTIwR82FLl.XWkkAaOy/Ek6XGCYme6ZRiow/6eDAn6FNlMCJu','super_admin',NULL,NULL,'2026-04-08 07:09:32','2026-04-09 06:33:23');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-04-15 13:57:21
