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
            ApplicationSession.Dispose();
            ApplicationSession = null;
        }

        [TestMethod]
        // Different extension and special characters in files name
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\#\\!.ods")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\#\\#.bmp")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\#\\$.rtf")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\#\\%.txt")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\#\\&.zip")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\#\\@.odt")]
        
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
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderDIB.dib")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderDicom.dcm")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderEPS.eps")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderGIF.gif")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderICO.ico")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderIff.iff")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderJPE.jpe")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderJPEG2000.jpf")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderJPEGStereo.jps")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderJPG.jpg")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderMPO.mpo")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderPBM.pbm")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderPCX.pcx")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderPDF.pdf")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderPNG.png")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderPSB.psb")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderPSD.psd")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderPXR.pxr")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderRAW.raw")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderRLE.rle")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderSCT.sct")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderTGA.tga")]
        [DataRow("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\Images Extension\\FolderTIF.tif")]

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

            System.Threading.Thread.Sleep(1000); // Wait for 2 second until the dialog comes up
            // Open File Explorer
            var openFileBox = ApplicationSession.FindElementByClassName("#32770");

            openFileBox.FindElementByClassName("Edit").Click();
            openFileBox.FindElementByClassName("Edit").SendKeys(input1 + OpenQA.Selenium.Keys.Enter);

            System.Threading.Thread.Sleep(1000); // Wait for 1 second until the dialog close      
        }
    }
}
