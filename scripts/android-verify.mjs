import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const mode = process.argv[2] || 'release';
const report = JSON.parse(await fs.readFile(path.join(root,`work/android-build/${mode}-build.json`),'utf8'));
for (const item of report.artifacts) {
  const data = await fs.readFile(path.join(root,item.path));
  if (data.length !== item.bytes || createHash('sha256').update(data).digest('hex') !== item.sha256) throw new Error('Artifact checksum mismatch.');
}
const manifest = JSON.parse(await fs.readFile(path.join(root,`work/android-build/${mode}-asset-manifest.json`),'utf8'));
const result = spawnSync('python3',['-c',String.raw`
import sys,json,zipfile,hashlib,struct
root,report_json,manifest_json=sys.argv[1:]
report=json.loads(report_json);manifest=json.loads(manifest_json);checks=[]
for a in report['artifacts']:
 with zipfile.ZipFile(root+'/'+a['path']) as z:
  assert z.testzip() is None
  prefix='base/assets/public/' if a['path'].endswith('.aab') else 'assets/public/'
  files={n[len(prefix):]:n for n in z.namelist() if n.startswith(prefix) and not n.endswith('/')}
  expected={x['path']:x for x in manifest['files']}
  assert set(files)==set(expected), 'Native asset manifest differs'
  for n,item in expected.items():assert hashlib.sha256(z.read(files[n])).hexdigest()==item['sha256'],n
  native=[n for n in z.namelist() if n.endswith('.so')]
  elf=[]
  for n in native:
   data=z.read(n);assert data[:4]==b'\x7fELF',n
   endian='<' if data[5]==1 else '>';is64=data[4]==2
   off=struct.unpack_from(endian+('Q' if is64 else 'I'),data,32 if is64 else 28)[0]
   size,num=struct.unpack_from(endian+'HH',data,54 if is64 else 42)
   segments=[]
   for i in range(num):
    row=struct.unpack_from(endian+('IIQQQQQQ' if is64 else 'IIIIIIII'),data,off+i*size)
    if row[0]!=1:continue
    align=row[7];offset=row[2] if is64 else row[1];vaddr=row[3] if is64 else row[2]
    if is64:assert align>=16384 and offset%16384==vaddr%16384,n+' ELF LOAD segment is not 16KB-compatible'
    segments.append(align)
   assert segments,n+' lacks LOAD segment'
   elf.append({'path':n,'bits':64 if is64 else 32,'loadAlignments':segments,'checked16KB':is64})
  signing=any(n.startswith('META-INF/') and n.endswith(('.RSA','.DSA','.EC')) for n in z.namelist())
  checks.append({'path':a['path'],'assetFiles':len(files),'nativeLibraries':native,'jarSignaturePresent':signing,'elfAlignment':elf})
print(json.dumps(checks))
`,root,JSON.stringify(report),JSON.stringify(manifest)],{encoding:'utf8'});
if (result.status !== 0) throw new Error(result.stderr || 'Archive verification failed.');
const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
if(!sdk)throw new Error('ANDROID_HOME required for package verification.');
const buildTools=path.join(sdk,'build-tools','36.0.0');
const exec=(command,args)=>{const r=spawnSync(command,args,{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout||'Package verification command failed.');return r.stdout;};
const packageChecks=[];
for(const artifact of report.artifacts){
 const file=path.join(root,artifact.path);
 if(file.endsWith('.apk')){
  exec(path.join(buildTools,'zipalign'),['-c','-P','16','4',file]);
  const badging=exec(path.join(buildTools,'aapt'),['dump','badging',file]);
  if(!badging.includes("package: name='"+report.applicationId+"'")||!badging.includes("sdkVersion:'24'")||!badging.includes("targetSdkVersion:'36'"))throw Error('Packaged identity or SDK differs.');
  const permissions=badging.split('\n').filter(x=>x.startsWith('uses-permission:'));
  if(permissions.some(x=>/RECORD_AUDIO|CAMERA|READ_MEDIA|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE/.test(x)))throw Error('Unexpected broad permission in package.');
  if(report.signing!=='unsigned-technical-build')exec(path.join(buildTools,'apksigner'),['verify','--verbose',file]);
  packageChecks.push({path:artifact.path,zipAlignment16KB:true,minSdk:24,targetSdk:36,permissions,cryptographicSignatureVerified:report.signing!=='unsigned-technical-build'});
 }else{
  if(!process.env.BUNDLETOOL_JAR||!process.env.JAVA_HOME)throw Error('BUNDLETOOL_JAR and JAVA_HOME required to validate AAB.');
  const java=path.join(process.env.JAVA_HOME,'bin/java');exec(java,['-jar',process.env.BUNDLETOOL_JAR,'validate','--bundle='+file]);
  const config=exec(java,['-jar',process.env.BUNDLETOOL_JAR,'dump','config','--bundle='+file]);
  if(!config.includes('PAGE_ALIGNMENT_16K'))throw Error('AAB does not request 16KB page alignment.');
  packageChecks.push({path:artifact.path,bundletoolValidated:true,pageAlignment:'PAGE_ALIGNMENT_16K'});
 }
}
const output = { packageChecks, verifiedAt: new Date().toISOString(), status:'passed', archiveChecks:JSON.parse(result.stdout), signing:report.signing, applicationId:report.applicationId, provisionalIdentity:report.provisionalIdentity, physicalDeviceTested:false, playUploaded:false, note:'ZIP payload, SDK/identity, requested permissions, 64-bit ELF LOAD alignment and bundletool validation passed. Physical-device behavior and production signing remain separate release gates.' };
await fs.writeFile(path.join(root,`work/android-build/${mode}-verification.json`),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
