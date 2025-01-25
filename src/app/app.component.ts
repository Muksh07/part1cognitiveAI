import { Component, HostListener, Renderer2} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Services/api.service';
import { Subscription, take } from 'rxjs';
import {saveAs} from 'file-saver';
import JSZip from 'jszip';
// import mammoth from 'mammoth';
 
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AppComponent {
  activeTab: string = 'Insight Elicitation';
  activeBlueprintingSubTab: string = 'Requirement Summary';
 
 
 
  //dynamic textarea
  private resizingSection: 'input' | 'output' | 'folder' | 'content' | null = null;
  private minSectionWidth: number = 20; // Minimum width percentage
 
  private minWidthPercentage = 20;
 
 
 
  // Properties for the Blueprinting sub-tabs
  requirementSummary: string = '';
  solutionOverview: string = '';
  projectStructure: string = '';
  dataFlow: string = '';
  unitTesting: string = '';
  commonFunctionalities: string = '';
  databaseScripts: string = '';
  parsedStructure: any;
  selectedContent: string = '';
 
  taskInput: string = '';
  promptLimit: number = 2048;
  tokenLimit: number = 4096;
 
  // Other properties
  inputText: string = '';
  outputText: string = '';
  tokenCount: number = 0;
  completionTokens: number = 0;
  promptTokens: number = 0;
  totalTokens: number = 0;
  technicalRequirement: string = '';
  solutionDesign: string = '';
  blueprintingContent: string = '';
 
  // Property for Code Synthesis
  codeSynthesisContent: string = '';
  isAnalyzing: boolean = false;
  response: boolean = false;
  codeSynthesisFolderStructure: any[] = [];
  selectedCodeFile: string = '';
  selectedCodeContent: string = '';
  unittesttree: any;
  databasetree: any;
  datascripttree: any;
  unittestingtree: any;
  loading: boolean = false;
  isdescribe: boolean = false;
 
  //variables for processing
  isAnalyzingCOD : boolean = false;
  responseCOD : boolean = false;
  isAnalyzingBRD : boolean = false;
  responseBRD : boolean = false;
  isAnalyzingSOL : boolean = false;
  responseSOL : boolean = false;
  isAnalyzingBLU : boolean = false;
  responseBLU : boolean = false;

   //subscribe
   private apiBRD: Subscription | undefined;
   private apiSOL: Subscription | undefined;
   private apiBLU: Subscription | undefined;
   private apiCOD: Subscription | undefined;
   private abortController: AbortController | undefined;
 
 
 
 
  constructor(private apiService: ApiService,private renderer: Renderer2) {}
 
 
 
 
  // Tabs and sub-tabs
  tabs: string[] = [
    'Insight Elicitation',
    'Solidification',
    'Blueprinting',
    'Code Synthesis',
  ];
  blueprintingSubTabs: string[] = [
    'Requirement Summary',
    'Solution Overview',
    'Project Structure',
    'Data Flow',
    'Unit Testing',
    'Common Functionalities',
    'Database Scripts',
  ];
 
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
 
  setActiveBlueprintingSubTab(subTab: string) {
    this.activeBlueprintingSubTab = subTab;
  }
 
  startBluePrinting() {
    this.requirementSummary = `Technical Requirement:\n${this.technicalRequirement}\n\nSolution Design:\n${this.solutionDesign}`;
    this.setActiveTab('Blueprinting');
    this.setActiveBlueprintingSubTab('Requirement Summary');
  }
 
  startCodeSynthesis() {
    this.isAnalyzingCOD = true; // Show "Processing..."
    this.responseCOD = false; // Hide "RESPONSE RECEIVED"
    
    
    // Traverse and update the folder structure
    this.traverseAndUpdateFolderStructure(
      this.codeSynthesisFolderStructure[0]
    ).then(() => {
      this.isAnalyzingCOD = false; // Hide "Processing..."
      this.responseCOD = true; // Show "RESPONSE RECEIVED"
    });
  }
  logUpdatedFolderStructure() {
    console.log('Updated Folder Structure:', JSON.stringify(this.codeSynthesisFolderStructure, null, 2));
  }
 
 
 
 
 
  //combine width change
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.resizingSection) {
      const container = document.querySelector('.code-synthesis-container') ||
                        document.querySelector('.main-content');
     
      if (container) {
        const containerWidth = container.clientWidth;
        let newWidth: number;
 
        if (this.resizingSection === 'input' || this.resizingSection === 'output') {
          const inputSection = document.querySelector('.input-section') as HTMLElement;
          const outputSection = document.querySelector('.output-section') as HTMLElement;
 
          if (this.resizingSection === 'input') {
            newWidth = ((event.clientX - container.getBoundingClientRect().left) / containerWidth) * 100;
            newWidth = Math.max(newWidth, this.minSectionWidth); // Ensure minimum width
            newWidth = Math.min(newWidth, 100 - this.minSectionWidth); // Ensure the total width doesn't exceed 100%
inputSection.style.flex = `0 0 ${newWidth}%`;
outputSection.style.flex = `0 0 ${100 - newWidth - 2}%`;
          } else if (this.resizingSection === 'output') {
            newWidth = ((containerWidth - (event.clientX - container.getBoundingClientRect().left)) / containerWidth) * 100;
            newWidth = Math.max(newWidth, this.minSectionWidth); // Ensure minimum width
            newWidth = Math.min(newWidth, 100 - this.minSectionWidth); // Ensure the total width doesn't exceed 100%
outputSection.style.flex = `0 0 ${newWidth}%`;
inputSection.style.flex = `0 0 ${100 - newWidth - 2}%`;
          }
        } else if (this.resizingSection === 'folder' || this.resizingSection === 'content') {
          const folderSection = document.querySelector('.code-folder-structure-section') as HTMLElement;
          const contentSection = document.querySelector('.code-content-section') as HTMLElement;
 
          if (this.resizingSection === 'folder') {
            newWidth = ((event.clientX - container.getBoundingClientRect().left) / containerWidth) * 100;
            newWidth = Math.max(newWidth, this.minSectionWidth); // Ensure minimum width
            newWidth = Math.min(newWidth, 100 - this.minSectionWidth); // Ensure the total width doesn't exceed 100%
folderSection.style.flex = `0 0 ${newWidth}%`;
contentSection.style.flex = `0 0 ${100 - newWidth - 2}%`;
          } else if (this.resizingSection === 'content') {
            newWidth = ((containerWidth - (event.clientX - container.getBoundingClientRect().left)) / containerWidth) * 100;
            newWidth = Math.max(newWidth, this.minSectionWidth); // Ensure minimum width
            newWidth = Math.min(newWidth, 100 - this.minSectionWidth); // Ensure the total width doesn't exceed 100%
contentSection.style.flex = `0 0 ${newWidth}%`;
folderSection.style.flex = `0 0 ${100 - newWidth - 2}%`;
          }
        }
      }
    }
  }
 
  @HostListener('window:mouseup')
  onMouseUp() {
    this.resizingSection = null;
    this.renderer.removeClass(document.body, 'resizing');
  }
 
  @HostListener('window:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
 
    if (target.closest('.input-section') && event.offsetX > target.clientWidth - 10) {
      this.resizingSection = 'input';
    } else if (target.closest('.output-section') && event.offsetX < 10) {
      this.resizingSection = 'output';
    } else if (target.closest('.code-folder-structure-section') && event.offsetX > target.clientWidth - 10) {
      this.resizingSection = 'folder';
    } else if (target.closest('.code-content-section') && event.offsetX < 10) {
      this.resizingSection = 'content';
    }
  }
 
 
 
  uploadBRD() 
  {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt'; // Specify the file types you want to allow
 
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
 
        reader.onload = (e) => {
          if (e.target) {
            const text = e.target.result as string;
            this.inputText = text; // Assuming inputtext is a global variable
            console.log('File content:', text);
          } else {
            console.error('Error: e.target is null');
          }
        };
 
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
        };
 
        reader.readAsText(file);
      }
    };
 
    input.click();
  }
 


  getTokenCount() {}

  abortBRD(){
    if (this.apiBRD) {
      this.apiBRD.unsubscribe();
      this.isAnalyzingBRD = false;
      this.responseBRD = false;
    }
  }
 
  analyzeBRD() 
  {
    this.settodefault(1)
    this.isAnalyzingBRD = true;
    this.responseBRD = false;
    if(!this.taskInput)
    {
      this.taskInput=" ";
      this.apiService.APIanalyzeBRD('', this.inputText, this.taskInput)
      .pipe(take(1))
      .subscribe(
        (response) => {
          this.outputText = response;
          if (this.outputText.length > 0) {
            this.isAnalyzingBRD = false;
            this.responseBRD = true;
          }
          // Stop the spinner after the response
        },
        (error) => {
          console.error('Error during BRD analysis:', error);
 
          this.isAnalyzingBRD = false; // Stop the spinner even if there's an error
        }
      );
    }
    else{
      this.apiService.APIanalyzeBRD('', this.inputText, this.taskInput)
      .pipe(take(1))
      .subscribe(
        (response) => {
          this.outputText = response;
          if (this.outputText.length > 0) {
            this.isAnalyzingBRD = false;
            this.responseBRD = true;
          }
          // Stop the spinner after the response
        },
        (error) => {
          console.error('Error during BRD analysis:', error);
 
          this.isAnalyzingBRD = false; // Stop the spinner even if there's an error
        }
      );
    }
  }
  saveBRD() {}
  saveContextHistory() {}
  showContextHistory() {}


  
 
  solidify() 
  {
    this.settodefault(2)
    // this.technicalRequirement = this.outputText;
    this.isAnalyzingSOL = true;
    this.responseSOL = false;
    //console.log(this.outputText,"this.outputtext");
    this.apiService.Solidify(this.outputText).subscribe(
      (response) => {
        this.technicalRequirement = response;
        if (this.technicalRequirement.length > 0) {
          this.isAnalyzingSOL = false;
          this.responseSOL = true;
        }
        // Stop the spinner after the response
      },
      (error) => {
        console.error('Error during Solidify:', error);
 
        this.isAnalyzingSOL = false; // Stop the spinner even if there's an error
 
      }
    );
  }
  
  abortSOL(){
    if (this.apiSOL) {
      this.apiSOL.unsubscribe();
      this.isAnalyzingSOL = false;
      this.responseSOL = false;
    }
  }

  settodefault(i: number) {
    if (i == 1) {
    this.outputText = "";
    this.technicalRequirement = "";
    this.solutionOverview = "";
    this.dataFlow = "";
    this.commonFunctionalities = "";
    this.projectStructure = "";
    this.requirementSummary = "";
    this.unitTesting = "";
    this.databaseScripts = "";
    this.codeSynthesisFolderStructure = [];
    this.folderStructure = [];
    this.isAnalyzingBLU = false;
    this.responseBLU = false;
    this.projectStructureDescription = "";
    this.selectedContent = "";
    this.selectedCodeContent = "";
  }
  else if (i ==2){
    this.technicalRequirement = "";
    this.solutionOverview = "";
    this.dataFlow = "";
    this.commonFunctionalities = "";
    this.projectStructure = "";
    this.requirementSummary = "";
    this.unitTesting = "";
    this.databaseScripts = "";
    this.codeSynthesisFolderStructure = [];
    this.folderStructure = [];
    this.isAnalyzingBLU = false;
    this.responseBLU = false;
    this.projectStructureDescription = "";
    this.selectedContent = "";
    this.selectedCodeContent = "";
  }
  else if (i==3){}
  this.solutionOverview = "";
  this.dataFlow = "";
  this.commonFunctionalities = "";
  this.projectStructure = "";
  this.requirementSummary = "";
  this.unitTesting = "";
  this.databaseScripts = "";
  this.codeSynthesisFolderStructure = [];
  this.folderStructure = [];
  this.isAnalyzingBLU = false;
  this.responseBLU = false;
  this.projectStructureDescription = "";
  this.selectedContent = "";
  this.selectedCodeContent = "";
  }

  abortBLU(){
    if (this.apiBLU) {
      this.apiBLU.unsubscribe();
      this.isAnalyzingBLU = false;
      this.responseBLU = false;
    }
  }
 
  blueprinting()
  {
    this.settodefault(3)
    this.isAnalyzingBLU = true;
    this.responseBLU = false;
    this.apiService.Blueprinting(this.technicalRequirement).subscribe(
      (response: { [key: string]: string }) => {
        this.solutionOverview = response['solutionOverview'];
        this.dataFlow = response['dataFlow'];
        this.commonFunctionalities = response['commonFunctionalities'];
        this.projectStructure = response['projectStructure'];
        this.requirementSummary = response['requirementSummary'];
        this.unitTesting = response['unitTesting'];
        this.databaseScripts = response['databaseScripts'];
        console.log('my database script', this.databaseScripts);
        console.log('my unit testing', this.unitTesting);
 
        this.fetchFolderStructure(this.projectStructure);
        this.projectStructureDescription = this.projectStructure;
 
        this.createUnittesttree(this.unitTesting);
        this.createdatabasetree(this.databaseScripts);
        this.synfetchFolderStructure(this.projectStructure);
       
        this.isAnalyzingBLU = false;
        this.responseBLU = true;
       
      },
      (error) => {
        console.error('Error:', error);
        this.isAnalyzingBLU = false;
        //Handle the error here
      }
    );
  }
 
  projectStructureDescription: string = '';
  //projectStructureDescription: string = this.projectStructure;
  folderStructure: any[] = [];
  selectedFileContent: string = '';
 
  ngOnInit() {
    //this.fetchFolderStructure();
  }
 
 
  fetchFolderStructure(structure: string) {
    const inputString = structure;
 
    this.folderStructure = this.parseStructure(inputString);
    console.log(
      'Parsed Folder Structure:',
      JSON.stringify(this.folderStructure, null, 2)
    );
  }
 

  parseStructure(input: string): any[] 
  {
    // Define regex patterns for different headers, allowing for any leading characters
    const headerPatterns = {
      solutionName: /(?:[-#\s]*)solution\s+name:\s*(.*)/i,
      rootFolder: /(?:[-#\s]*)root\s+folder:\s*(.*)/i,
      projectName: /(?:[-#\s]*)project\s+name:\s*(.*)/i,
      projectPath: /(?:[-#\s]*)project\s+path:\s*(.*)/i,
      fileName: /(?:[-#\s]*)file\s+name:\s*(.*)/i
    };
   
    // Normalize a line by trimming spaces and removing extra characters
    const normalizeLine = (line: string) => line.trim();
   
    // Initialize root node and current context
    const rootNode: any = { name: '', type: 'folder', expanded: false, children: [], content: 'Solution Name' };
    let currentParent: any = rootNode;
    let currentFolder: any = null;
    let currentProjectName: string | null = null;
    let currentFileName: string | null = null;
    let contentAccumulator: string = '';
   
    // Function to clean folder names
    const cleanFolderName = (name: string) => {
      const parts = name.split('/').map(part => part.trim()).filter(part => part);
      return parts.length ? parts.pop() : name;
    };
   
    // Split input by lines
    const lines = input.split('\n').map(normalizeLine).filter(line => line);
   
    lines.forEach(line => {
      let matched = false;
   
      // Check each line against header patterns
      for (const [key, pattern] of Object.entries(headerPatterns)) {
        const match = line.match(pattern);
        if (match) {
          matched = true;
          const content = match[1].trim();
   
          if (key === 'solutionName') {
            rootNode.name = content;
            rootNode.content = 'Solution Name'; // Set content for solution name
            rootNode.expanded = true;    //by m
          } else if (key === 'rootFolder') 
            {
            const folderName = cleanFolderName(content);
            currentParent = { name: folderName, type: 'folder', expanded: true, children: [], content: 'Root Folder' };
            rootNode.children.push(currentParent);
            //rootNode.expanded = true;  // by m
          } else if (key === 'projectName') {
            currentProjectName = content;
            currentFolder = { name: currentProjectName, type: 'folder', expanded: false, children: [] };
            if (currentParent) {
              currentParent.children.push(currentFolder);
            }
          } else if (key === 'projectPath') {
            if (currentFolder) {
              currentFolder.content = content;
            }
          } else if (key === 'fileName') {
            if (currentFolder) {
              const [fileName, ...fileContentParts] = content.split(' (');
              const fileContent = fileContentParts.join(' (').replace(/\)$/, '').trim();
              currentFolder.children = currentFolder.children || [];
              currentFolder.children.push({ name: fileName.trim(), type: 'file', content: fileContent });
            }
          }
          break;
        }
      }
   
      // If no header matched, accumulate content if it's part of a file's content
      if (!matched) {
        if (currentFolder && currentFolder.children && currentFolder.children.length > 0) {
          const lastFile = currentFolder.children[currentFolder.children.length - 1];
          if (lastFile.type === 'file') {
            lastFile.content += `\n${line}`;
          }
        }
      }
    });
   
    // Final trim for content
    const trimFolderContent = (folder: any) => {
      if (folder.children) {
        folder.children.forEach((child: any) => {
          if (child.type === 'folder') {
            trimFolderContent(child);
          } else if (child.type === 'file') {
            child.content = child.content.trim(); // Trim content for each file
          }
        });
      }
    };
   
    trimFolderContent(rootNode);
   
    return [rootNode];
  }


 
  fetchFileContent(fileName: string) {
    const findFileContent = (folder: any): string | null => {
      if (folder.type === 'folder' && folder.children) {
        for (const child of folder.children) {
          if (child.type === 'file' && child.name === fileName) {
            return child.content;
          } else if (child.type === 'folder') {
            const content = findFileContent(child);
            if (content) return content;
          }
        }
      }
      return null;
    };
 
    const content = findFileContent(this.folderStructure[0]);
    if (content) {
      this.selectedContent = content;
    } else {
      this.selectedContent = 'File content not found.';
    }
  }
 
  showFileContent(item: any) {
    this.selectedContent = item.content || 'No content available.';
  }
 
  showFolderContent(item: any) {
    this.selectedContent = item.content || 'No content available.';
  }
 
  showCodeFileContent(item: any) {
    this.selectedCodeContent = item.content || 'No content available.';
  }
 
  showCodeFolderContent(item: any) {
    this.selectedCodeContent = item.content || 'No content available.';
  }
 
  toggleFolder(item: any) {
    item.expanded = !item.expanded;
  }
 
  showCodeContent(content: string) {
    this.selectedCodeContent = content;
  }
 

  toggleCodeFile(item: any) {
    if( (item.type === 'file') && (item.code || item.description)) {
      item.expanded = !item.expanded;
    }
  }
 
  showDescription= false;

 
  extractCode(temp: any): string {
    const pattern = /```([a-zA-Z0-9_]+)?\s*([\s\S]*?)\s*```/;
    const match = temp.match(pattern);
    if (match && match[2]) {
      return match[2].trim();
    }
    else{
      return temp;
    };
  }



  istraversing:boolean = true;

  startApiCall(): void {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
  }

  async traverseAndUpdateFolderStructure(node: any, level: number = 0, parentfolder: string = ''): Promise<void> 
  {
    if(!this.istraversing) {
      return;
    }
     console.log(`Traversing: ${node.name}, Level: ${level}, Current Parent Folder: ${parentfolder}`);
        
        // Set the node as expanded before starting processing
        node.expanded = true;
     
        // Check if we're at level 2 and it's a folder named 'DataScripting' or 'UnitTest'
        if (node.type === 'folder' && level === 2) 
        {
           if (node.name === 'DataScripting') 
           {
                parentfolder = 'DataScripting';
                console.log(`Found DataScripting folder at level 2, setting parentfolder to ${parentfolder}`);
            } 
            else if (node.name === 'UnitTest') 
            {
                parentfolder = 'UnitTest';
                console.log(`Found UnitTest folder at level 2, setting parentfolder to ${parentfolder}`);
            } 
            else 
            {
                console.log(`At level 2, but folder name does not match: ${node.name}`);
            }
        }
     
        // Process file based on the parentfolder
        if (node.type === 'file') 
        {
            try {
                 if (parentfolder === 'UnitTest')
                 {
                    if (!this.isdescribe) 
                    {
                       console.log(`Processing UnitTest file: ${node.name}`);
                       const response = await this.apiService.Codesynthesis(node.name, node.content, 2, this.dataFlow, this.solutionOverview).toPromise();
                       node.code = this.extractCode(response);
                    } 
                    else 
                    {
                        // Process code and description
                        const codeResponse = await this.apiService.Codesynthesis(node.name, node.content, 2, this.dataFlow, this.solutionOverview).toPromise();
                        node.code = this.extractCode(codeResponse);
     
                          const descriptionResponse = await this.apiService.Codesynthesis(node.name, node.content, 3, this.dataFlow, this.solutionOverview).toPromise();
                          node.description = descriptionResponse;
                    }
                    console.log(`Processed UnitTest file: ${node.name} at level ${level}`);
                  } 
                  else if (parentfolder === 'DataScripting') 
                  {
                    if (!this.isdescribe) 
                    {
                      console.log(`Processing DataScripting file: ${node.name}`);
                      const response = await this.apiService.Codesynthesis(node.name, node.content, 1, this.dataFlow, this.solutionOverview).toPromise();
                      node.code = this.extractCode(response);
                    } 
                    else 
                    {
                        // Process code and description
                    const codeResponse = await this.apiService.Codesynthesis(node.name, node.content, 1, this.dataFlow, this.solutionOverview).toPromise();
                    node.code = this.extractCode(codeResponse);
     
                      const descriptionResponse = await this.apiService.Codesynthesis(node.name, node.content, 3, this.dataFlow, this.solutionOverview).toPromise();
                        node.description = descriptionResponse;
                    }
                    console.log(`Processed DataScripting file: ${node.name} at level ${level}`);
                } 
                else 
                {
                    if (!this.isdescribe) 
                    {
                      console.log(`Processing general file: ${node.name}`);
                      const response = await this.apiService.Codesynthesis(node.name, node.content, 0, this.dataFlow, this.solutionOverview).toPromise();
                      node.code = this.extractCode(response);
                    } 
                    else 
                    {
                        // Process code and description
                      const codeResponse = await this.apiService.Codesynthesis(node.name, node.content, 0, this.dataFlow, this.solutionOverview).toPromise();
                      node.code = this.extractCode(codeResponse);
     
                      const descriptionResponse = await this.apiService.Codesynthesis(node.name, node.content, 3, this.dataFlow, this.solutionOverview).toPromise();
                                          node.description = descriptionResponse;
                    }
                    console.log(`Processed general file: ${node.name} at level ${level}`);
                }
                node.expanded = true;
            } 
            catch (error) 
            {
               console.error(`Error during processing file: ${node.name}`, error);
            }
        }
     
        // Recursively traverse children
        if (node.children) {
            for (const child of node.children) {
                await this.traverseAndUpdateFolderStructure(child, level + 1, parentfolder);
            }
        }
     
        // Set the node as not expanded after all processing (including children) is complete
        // node.expanded = false;
     
      console.log(`Completed processing for ${node.name}`);
  }

  abortCOD(){
    this.istraversing = false;
  }


 
  findFileByName(name: string, folderStructure: any[]): any {
    for (const folder of folderStructure) {
      if (folder.type === 'folder') {
        const result = this.findFileByName(name, folder.children);
        if (result) return result;
      } else if (folder.type === 'file' && folder.name === name) {
        return folder;
      }
    }
    return null;
  }
 
  formatFileDetails(file: any): string {
    let details = `File Name: ${file.name}\n`;
    for (const [key, value] of Object.entries(file.details)) {
      if (Array.isArray(value)) {
        details += `${key}:\n- ${value.join('\n- ')}\n`;
      } else {
        details += `${key}: ${value}\n`;
      }
    }
    return details;
  }
 
  toggleCodeFolder(folder: any) {
    folder.expanded = !folder.expanded;
  }
 
  fetchCodeFileContent(fileName: string) {
    this.selectedCodeFile = fileName;
    this.selectedCodeContent = `// This is the content of ${fileName}\n// Actual code would be displayed here in a real application.`;
  }
 
  startCodeSynthesistest() {
    this.codeSynthesisContent = `Blueprint:\n${this.blueprintingContent}`;
    this.setActiveTab('Code Synthesis');
  }
 
  
  ///////////////////////////////////////////////////////////////////////////////////
  synfetchFolderStructure(structure: string) 
  {
    const inputString = structure;
    this.codeSynthesisFolderStructure = this.parseStructure(inputString);
    const temp = {
      name: 'DataScripting',
      type: 'folder',
      expanded: false,
      children: this.datascripttree,
    };
    const temp2 = {
      name: 'UnitTest',
      type: 'folder',
      expanded: false,
      children: this.unittestingtree,
    };
    console.log('ohohohoo', this.unittestingtree);
    this.codeSynthesisFolderStructure[0]['children'][0]['children'].push(temp2);
    this.codeSynthesisFolderStructure[0]['children'][0]['children'].push(temp);
 
    console.log(
      'children',
      this.codeSynthesisFolderStructure[0]['children'][0]['children']
    );
    // console.log(this.folderStructure,'this')
    console.log(
      'Parsed code synthesis:',
      JSON.stringify(this.codeSynthesisFolderStructure[0], null, 2)
    );
  }
 
 
  parseDatabaseScript(input: string): any[] {
    const databaseScript: any[] = [];
    
    // Find the database section
    const dbSectionMatch = input.match(/- Database Name:\s*(.*?)\s*(?=- Tables:)/is);
    if (dbSectionMatch) {
      const database: any = {
        type: 'folder',
        expanded: false,
        children: [],
        name: dbSectionMatch[1].trim()
      };
   
      // Extract the tables section
      const tablesSection = input.split(/- Tables:\s*/is)[1]?.trim();
      
      if (tablesSection) {
        // Extract each table section
        const tableSections = tablesSection.split(/- Table Name:/is).filter(section => section.trim());
        
        tableSections.forEach((table, index) => {
          const tableObj: any = { type: 'file', content: '', name: '' };
          
          // Extract the table name
          const tableNameMatch = table.match(/^\s*(.*?)\s*(?=\n|$)/is);
          if (tableNameMatch) {
  tableObj.name = tableNameMatch[1].trim() + '.sql';
          }
          
          // Extract content for the table
          let content = table.trim();
          
          // Remove the table name for content
          content = content.replace(/^\s*.*?\s*(?=\n|$)/is, '').trim();
          
          tableObj.content = content;
  if (tableObj.name) {
            database.children.push(tableObj);
          }
        });
      }
   
  if (database.name && database.children.length > 0) {
        databaseScript.push(database);
      }
    }
    
    return databaseScript;
  }
 
  createdatabasetree(databasescript: string) {
    const input = databasescript;
 
    this.datascripttree = this.parseDatabaseScript(input);
 
    // Print the parsed structure to the console
    console.log('databasescript', JSON.stringify(this.datascripttree, null, 2));
  }
 
  createUnittesttree(unittesting: string) {
    const temp = unittesting;
 
    this.unittestingtree = this.parseText(temp);
 
    console.log(
      'unittestingtree',
      JSON.stringify(this.unittestingtree, null, 2)
    );
  }
 
  parseText(input: string): any[] {
    const projects: any[] = [];
    
    // Split the input into sections based on "Project name:"
    const sections = input.split(/(?=Project name:)/i).filter(section => section.trim());
    
    for (const section of sections) {
      const project: any = { type: 'folder', expanded: false, children: [] };
   
      // Extract project name
      const projectNameMatch = section.match(/Project name:\s*(.*)/i);
      if (projectNameMatch) {
  project.name = projectNameMatch[1].trim();
      }
    
      // Extract files and their content
      const fileMatches = section.match(/- File name:\s*(.*?)(?=(?:- File name:|Project name:|$))/gis);
   
      if (fileMatches) {
        for (const fileMatch of fileMatches) {
          const file: any = { type: 'file', content: '', name: '' };
   
          // Extract file name
          const fileNameMatch = fileMatch.match(/- File name:\s*(.*)/i);
          if (fileNameMatch) {
  file.name = fileNameMatch[1].trim();
          }
   
          // Extract class and test scenarios content
          const classMatch = fileMatch.match(/- Class:.*?(?=- File name:|- Test scenarios:|$)/gis);
          const testScenariosMatch = fileMatch.match(/- Test scenarios:.*?(?=- File name:|$)/gis);
   
          let content = '';
   
          if (classMatch) {
            content += classMatch[0].trim().replace(/- Class:/i, 'Class:');
          }
   
          if (testScenariosMatch) {
            content += '\n' + testScenariosMatch[0].trim().replace(/- Test scenarios:/i, 'Test scenarios:');
          }
   
          file.content = content.trim();
   
  if (file.name) {
            project.children.push(file);
          }
        }
      }
   
  if (project.name && project.children.length > 0) {
        projects.push(project);
      }
    }
    
    return projects;
  }

 
  downloadZip()
  {
    this.downloadFolderStructure(this.codeSynthesisFolderStructure[0]);
  }
  public async downloadFolderStructure(folderStructure: any)
  {
    const zip = new JSZip();
    this.addFolderToZip(folderStructure, zip);
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'folder-structure.zip');
  }
 
  private addFolderToZip(folder: any, zip: JSZip, folderPath: string = '')
  {
    if (folder.type === 'folder') {
      const newFolderPath = folderPath
        ? `${folderPath}/${folder.name}`
        : folder.name;
      folder.children.forEach((child: any) => {
        this.addFolderToZip(child, zip, newFolderPath);
      });
    } else if (folder.type === 'file') {
      // Add code file
      if (folder.code) {
        zip.file(`${folderPath}/${folder.name}`, folder.code);
      }
 
      // Add description file
      if (folder.description) {
        zip.file(`${folderPath}/${folder.name}.txt`, folder.description);
      }
    }
  }
 
}