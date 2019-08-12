import * as assert from 'assert';
import { Instance, SupportedRecordsHelper, SupportedRecords, Converter, AngularProvider, UiPage, ValidationScript, ScriptedRestResource } from '../../ServiceNow/all';
//import { ISysMetadataIWorkspaceConvertable } from "../../MixIns/all";
import { commands } from "vscode";
import { WorkspaceManager, MetaData } from '../../Manager/all';
import * as path from 'path';
import * as fs from 'fs';
import { ISysMetadataIWorkspaceConvertable } from '../../MixIns/all';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

//surpress log output
// console.log = function () { };
// console.warn = function () { };
console.error = function () { };


/** todo
 * 
 * update set validation
 * 
 * save record validation
 */

// Defines a Mocha test suite to group tests of similar kind together
suite("CodeNow Integration", async function ()
{
    this.timeout(30000);

    let instance: Instance | undefined;

    test("Extension can connect", async () =>
    {
        instance = await commands.executeCommand<Instance>("cn.connect", { instanceName: process.env.npm_config_instanceName, userName: process.env.npm_config_userName, password: process.env.npm_config_password });
        if (instance)
        {
            assert.equal((instance.IsInitialized()), true);
        }
    });

    let allSupported: Array<string> = SupportedRecordsHelper.GetRecordsDisplayValue();

    suite("Record Caching", async () =>
    {
        test("Supported Records found", () =>
        {
            assert.ok(allSupported.length > 0);
        });

        allSupported.forEach(async (type) =>
        {
            test(`${type} cached`, async () =>
            {
                //@ts-ignore index error false
                let recType: SupportedRecords = SupportedRecords[type];

                if (instance)
                {
                    let cached = await instance.GetRecords(recType);

                    assert.ok(cached.length > 0, `${cached.length} found`);
                }
            });
        });
    });

    suite("Add/remove Records in WorkSpace", async () =>
    {
        test("Supported Records found", () =>
        {
            assert.ok(allSupported.length > 0);
        });

        test('Instance defined', () =>
        {
            assert.equal(instance !== undefined, true);
        });

        allSupported.forEach(async (type) =>
        {
            let added: MetaData | undefined;

            test(`${type} Added`, async () =>
            {
                //@ts-ignore index error false
                let recType: SupportedRecords = SupportedRecords[type];

                if (instance)
                {
                    let wm = new WorkspaceManager(instance.WorkspaceStateManager);

                    let cached = await instance.GetRecords(recType);

                    added = await wm.AddRecord(cached[0], instance);

                    test('Record have been Added', () =>
                    {
                        assert.equal(added === undefined, false);
                    });
                }
            });

            test(`${type} Files Created properly`, () =>
            {
                if (added)
                {
                    let files = added.Files;
                    let basedir = added.getRecordUri();

                    files.forEach((kv) =>
                    {
                        let fullPath = `${basedir.fsPath}${kv.value.fsPath}`;
                        assert.equal(fs.existsSync(fullPath), true, `file do not exist at: ${fullPath}, should have been created,`);

                        let ext = Converter.getFileTypeExtension(kv.key);
                        let baseName = path.basename(fullPath);

                        assert.equal(baseName.endsWith(ext), true, `Extension is not: ${ext}`);
                    });
                }
            });

            test.skip(`Update saved properly: ${type}`, () =>
            {
                //implement me ensure updates are saved on instance
            });

            test(`Delete ${type} from workspace`, async () =>
            {
                if (instance && added)
                {
                    //delete does not throw
                    let wm = new WorkspaceManager(instance.WorkspaceStateManager);
                    assert.doesNotThrow(async () =>
                    {
                        if (added)
                        {
                            await wm.DeleteRecord(added);
                        }
                    }, "Delete file from workspace threw");

                    //all files have been removed
                    let files = added.Files;
                    let basedir = added.getRecordUri();

                    files.forEach((kv) =>
                    {
                        let fullPath = `${basedir.fsPath}${kv.value.fsPath}`;
                        assert.equal(fs.existsSync(fullPath), false, `file exist at: ${fullPath}, should have been deletede.`);
                    });
                }
            });
        });
    });

    suite('Record Operations  - instance', async () =>
    {
        test("Supported Records found", () =>
        {
            assert.ok(allSupported.length > 0);
        });

        test('Instance defined', () =>
        {
            assert.equal(instance !== undefined, true);
        });


        for (let index = 0; index < allSupported.length; index++) 
        {
            const recordType = allSupported[index];

            //@ts-ignore index error false
            let recType: SupportedRecords = SupportedRecords[recordType];

            let availableTypes: Array<string>;

            let name = `${process.env.workspaceName}_${recType}`;

            //handle record types with special requiements.
            switch (recType)
            {
                case SupportedRecords["Angular Provider"]:

                    suite(`CRUD for ${recType}`, () =>
                    {
                        availableTypes = AngularProvider.getTypes();

                        availableTypes.forEach(async (type) =>
                        {
                            let createdRecord: ISysMetadataIWorkspaceConvertable;
                            test(`Create: ${type}`, async () =>
                            {
                                if (instance)
                                {
                                    createdRecord = await instance.CreateRecord(recType, {
                                        'name': `${name}_${type}`,
                                        'type': type
                                    });

                                    assert.equal(createdRecord !== undefined, true, `Record not Created`);

                                    let createdRecordFromInstance = await instance.GetRecord(createdRecord);

                                    assert.equal(createdRecordFromInstance !== undefined, true, `Unable to retrieve the created record from instance`);
                                }
                            });

                            test.skip(`Update: ${type}`, () =>
                            {
                                //implement me ensure updates are saved on instance
                            });

                            test(`Delete: ${type}`, async () =>
                            {
                                if (instance)
                                {
                                    await chai.expect(instance.DeleteRecord(createdRecord)).to.be.fulfilled;

                                    await chai.expect(instance.GetRecord(createdRecord)).to.be.rejectedWith('status code 404');
                                }
                            });
                        });
                    });

                    break;

                case SupportedRecords["UI Page"]:
                    suite(`CRUD for ${recType}`, () =>
                    {
                        availableTypes = UiPage.getCategory();

                        availableTypes.forEach(async (type) =>
                        {
                            let createdRecord: ISysMetadataIWorkspaceConvertable;
                            test(`Create: ${type}`, async () =>
                            {
                                if (instance)
                                {
                                    createdRecord = await instance.CreateRecord(recType, {
                                        'name': `${name}_${type}`,
                                        'category': type
                                    });

                                    assert.equal(createdRecord !== undefined, true, `Record not Created`);

                                    let createdRecordFromInstance = await instance.GetRecord(createdRecord);

                                    assert.equal(createdRecordFromInstance !== undefined, true, `Unable to retrieve the created record from instance`);
                                }
                            });

                            test.skip(`Update: ${type}`, () =>
                            {
                                //implement me
                            });

                            test(`Delete: ${type}`, async () =>
                            {
                                if (instance)
                                {
                                    await chai.expect(instance.DeleteRecord(createdRecord)).to.be.fulfilled;

                                    await chai.expect(instance.GetRecord(createdRecord)).to.be.rejectedWith('status code 404');
                                }
                            });
                        });
                    });

                    break;

                case SupportedRecords["Validation Script"]:

                    suite(`CRUD for ${recType}`, () =>
                    {
                        availableTypes = ValidationScript.getTypes();

                        //only subset of types
                        availableTypes.slice(0, 10).forEach(async (type) =>
                        {
                            let createdRecord: ISysMetadataIWorkspaceConvertable;
                            test(`Create: ${type}`, async () =>
                            {
                                if (instance)
                                {
                                    createdRecord = await instance.CreateRecord(recType, {
                                        'description': `${name}_${type}`,
                                        'internal_type': type
                                    });

                                    assert.equal(createdRecord !== undefined, true, `Record not Created`);

                                    let createdRecordFromInstance = await instance.GetRecord(createdRecord);

                                    assert.equal(createdRecordFromInstance !== undefined, true, `Unable to retrieve the created record from instance`);
                                }
                            });

                            test.skip(`Update: ${type}`, () =>
                            {
                                //implement me
                            });

                            test(`Delete: ${type}`, async () =>
                            {
                                if (instance)
                                {
                                    await chai.expect(instance.DeleteRecord(createdRecord)).to.be.fulfilled;

                                    await chai.expect(instance.GetRecord(createdRecord)).to.be.rejectedWith('status code 404');
                                }
                            });
                        });
                    });
                    break;

                case SupportedRecords["Scripted Rest API"]:

                    suite(`CRUD for ${recType}`, () =>
                    {
                        let definition: ISysMetadataIWorkspaceConvertable;
                        test('Create Definition', async () =>
                        {
                            if (instance)
                            {
                                definition = await instance.CreateRecord(SupportedRecords["Scripted Rest Definition"], {
                                    'name': name
                                });
                            }
                            return chai.expect(definition).exist;
                        });


                        availableTypes = ScriptedRestResource.getOperations();
                        availableTypes.forEach(async (type) =>
                        {
                            let createdRecord: ISysMetadataIWorkspaceConvertable;
                            test(`Create Operation: ${type}`, async () =>
                            {
                                if (instance)
                                {
                                    createdRecord = await instance.CreateRecord(recType, {
                                        'name': `${name}_${type}`,
                                        'category': type
                                    });

                                    assert.equal(createdRecord !== undefined, true, `Record not Created`);

                                    let createdRecordFromInstance = await instance.GetRecord(createdRecord);

                                    assert.equal(createdRecordFromInstance !== undefined, true, `Unable to retrieve the created record from instance`);
                                }
                            });

                            test.skip(`Update: ${type}`, () =>
                            {
                                //implement me
                            });

                            test(`Delete Operation: ${type}`, async () =>
                            {
                                if (instance)
                                {
                                    await chai.expect(instance.DeleteRecord(createdRecord)).to.be.fulfilled;

                                    await chai.expect(instance.GetRecord(createdRecord)).to.be.rejectedWith('status code 404');
                                }
                            });
                        });

                        test(`Delete Definition:`, async () =>
                        {
                            if (instance)
                            {
                                await chai.expect(instance.DeleteRecord(definition)).to.be.fulfilled;

                                await chai.expect(instance.GetRecord(definition)).to.be.rejectedWith('status code 404');
                            }
                        });
                    });
                    break;
                default:
                    suite(`CRUD for ${recType}`, () =>
                    {
                        let createdRecord: ISysMetadataIWorkspaceConvertable;
                        test(`Create`, async () =>
                        {
                            if (instance)
                            {
                                createdRecord = await instance.CreateRecord(recType, {
                                    'name': `${name}`
                                });

                                assert.equal(createdRecord !== undefined, true, `Record not Created`);

                                let createdRecordFromInstance = await instance.GetRecord(createdRecord);

                                assert.equal(createdRecordFromInstance !== undefined, true, `Unable to retrieve the created record from instance`);
                            }
                        });

                        test.skip(`Update`, () =>
                        {
                            //implement me
                        });

                        test(`Delete`, async () =>
                        {
                            if (instance)
                            {
                                await instance.DeleteRecord(createdRecord);

                                await chai.expect(instance.GetRecord(createdRecord)).to.be.rejectedWith('status code 404');
                            }
                        });
                    });
                    break;
            }
        }
        //add/remove files to workspace tested through integration tests for adding records. No need to test twice. 
    });
});