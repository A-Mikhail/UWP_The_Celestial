using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium.Appium.iOS;
using OpenQA.Selenium.Remote;

namespace UnitTest_TheCelestial
{
    [TestClass]
    public class UnitTest1
    {
        protected const string WindowsApplicationDriverUrl = "http://127.0.0.1:4723";
        public static IOSDriver<IOSElement> ApplicationSession;

        [ClassInitialize]
        public static void Setup(TestContext context)
        {
            DesiredCapabilities appCapabilities = new DesiredCapabilities();
            // Id of application to test may finded through Inspect.exe
            appCapabilities.SetCapability("app", "51a830d1-e9e2-4a20-8a05-d547bfb2fc1c_z0qgta0qgdq0p!App");
            ApplicationSession = new IOSDriver<IOSElement>(new Uri(WindowsApplicationDriverUrl), appCapabilities);
            Assert.IsNotNull(ApplicationSession);

            // Clear items from database before starting
            ApplicationSession.FindElementByName(" Settings").Click();
            ApplicationSession.FindElementByName("General").Click();
            System.Threading.Thread.Sleep(1000);
            ApplicationSession.FindElementByName("Delete").Click();
            // Back button
            ApplicationSession.FindElementByName("App Bar Item").Click();
            ApplicationSession.FindElementByName(" Settings").Click();
        }

        [ClassCleanup]
        public static void TearDown()
        {
            ApplicationSession.Quit();
            ApplicationSession = null;
        }

        [TestMethod]
        // Different extension and special characters in files name
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\#\\!.ods")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\#\\#.bmp")]

        // Underscore folder and file name
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\_Folder\\_MegaUnderscoreFile.txt")]

        // .docx
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\A\\A.docx")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\A\\A1.docx")]

        // .xlsx - Office excel
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\B\\B.xlsx")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\B\\B1.xlsx")]

        // .mp3
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\C\\C.mp3")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\C\\C1.mp3")]

        // Image extensions
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderBMP.bmp")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderCUR.cur")]

        // Long name
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Long length naming\\First of the long length naming thath I don't know fit or not.txt")]

        // Numbers
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Number\\0.txt")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Number\\1.txt")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Number\\2.txt")]

        // Foreign languages
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Другие языки\\АБВ.txt")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Другие языки\\БВГ.txt")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Другие языки\\ВГД.txt")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Другие языки\\ЕЁЖ.txt")]

        public void AddFilesByOne(string input1)
        {
            ApplicationSession.FindElementByName("Pick Files").Click();

            // Wait for 1 second until the dialog comes up
            System.Threading.Thread.Sleep(1000);
            // Open File Explorer
            var openFileDialog = ApplicationSession.FindElementByClassName("#32770");

            openFileDialog.FindElementByClassName("Edit").Click();
            openFileDialog.FindElementByClassName("Edit").SendKeys(input1 + OpenQA.Selenium.Keys.Enter);

            // Wait for 1 second until the dialog close
            System.Threading.Thread.Sleep(1000);
        }

        [TestMethod]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Number")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\#")]

        public void AddFilesMany(string input1)
        {
            ApplicationSession.FindElementByName("Pick Files").Click();

            // Wait for 1 second until the dialog comes up
            System.Threading.Thread.Sleep(1000);
            // Open File Explorer
            var openFilesDialog = ApplicationSession.FindElementByClassName("#32770");

            // Enter location folder
            openFilesDialog.FindElementByName("All locations").Click();
            openFilesDialog.FindElementByName("Address").SendKeys(input1 + OpenQA.Selenium.Keys.Enter);

            openFilesDialog.FindElementByName("Items View").Click();
            openFilesDialog.FindElementByName("Items View").SendKeys(OpenQA.Selenium.Keys.Control + "a");

            // Open selected files
            openFilesDialog.SendKeys(OpenQA.Selenium.Keys.Alt + "o");
        }

        [TestMethod]
        [DataRow("D:\\Mikhail\\", "Programming")]
        [DataRow("D:\\Mikhail\\", "Other")]
        [DataRow("D:\\Mikhail\\", "Archive")]
        [DataRow("D:\\Mikhail\\", "Blogging")]
        [DataRow("D:\\Mikhail\\", "Books, PDF")]
        [DataRow("D:\\Mikhail\\", "Gtd")]

        public void AddFolder(string input1, string input2)
        {
            ApplicationSession.FindElementByName("Pick Folder").Click();

            // Wait for 1 second until the dialog comes up
            System.Threading.Thread.Sleep(1000);
            // Open File Explorer
            var openFolderDialog = ApplicationSession.FindElementByClassName("#32770");
           
            // Enter location folder
            openFolderDialog.FindElementByName("All locations").Click();
            openFolderDialog.FindElementByName("Address").SendKeys(input1 + OpenQA.Selenium.Keys.Enter);

            // Enter folder name
            openFolderDialog.FindElementByClassName("Edit").Click();
            openFolderDialog.FindElementByClassName("Edit").SendKeys(OpenQA.Selenium.Keys.Control + "a");
            openFolderDialog.FindElementByClassName("Edit").SendKeys(OpenQA.Selenium.Keys.Backspace);
            openFolderDialog.FindElementByClassName("Edit").SendKeys(input2);
            // Send 'Tab' key to focus on 'Select Folder' button
            openFolderDialog.SendKeys(OpenQA.Selenium.Keys.Tab);
            // Click Enter to send chosen folder into listView
            openFolderDialog.SendKeys(OpenQA.Selenium.Keys.Enter);
        }

        [TestMethod]
        public void TurnOnCredential()
        {
            // Clear items from database before starting
            ApplicationSession.FindElementByName(" Settings").Click();

            // Settings
            // General
            // Turn on credential
            // Exit app
            // Open app
            // Enter credential
            // Turn off credential
            // Done!
        }
    }
}
