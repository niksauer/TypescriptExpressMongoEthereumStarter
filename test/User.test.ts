import { setupTestEnvironment } from "./util/setup";
import request from "supertest";
import { Application } from "express";
import { Role } from "../src/interfaces/database/IUser";
import { PublicDriver } from "../src/interfaces/database/IDriver";
import { ErrorReason } from "../src/model/util/error/Error";
import { getJSendSuccessResponse, JSendResponseStatus, JSendErrorResponse } from "../src/model/util/response/JSendResponse";

// MARK: - Helper Methods
function validateDriver(driver: PublicDriver, expectedID: string) {
    expect(driver.id).toEqual(expectedID);
    expect(driver.role).toEqual(Role.Driver);
    expect(new Date(driver.registerAt)).toEqual(expect.any(Date));
    expect(driver.isSuspended).toBeFalsy;
}

// MARK: - Test Suite
describe("test /driver", () => {

    // MARK: - Data
    let app: Application;
    let basePath: string;
    
    const driverAuthToken = "";
    const driverID = "abc12345678";
 
    // MARK: - Hooks
    beforeAll(async () => {
        const environment = await setupTestEnvironment({ 
            database: {
                reset: true,
                entities: {
                    all: false
                }
            },
            blockchain: {
                funding: {
                    drivers: false
                }
            }
        });

        app = environment.expressApp;
        basePath = `${environment.app.basePath}/driver`;
    });
    
    // MARK: - Tests
    it("creates driver, should return 201 - Created", async (done) => {
        const response = await request(app)
            .post(basePath)
            .set({ 
                "Authorization": `Bearer ${driverAuthToken}` 
        });
        
        expect(response.status).toEqual(201);

        const driverResponse = getJSendSuccessResponse<"driver", PublicDriver>(response.body);
        const driver = driverResponse.data.driver;

        expect(driverResponse.status).toEqual(JSendResponseStatus.Success);

        validateDriver(driver, driverID);

        done();
    }); 

    it("creates driver again, should return 409 - Conflict", async (done) => {
        const response = await request(app)
            .post(basePath)
            .set({ 
                "Authorization": `Bearer ${driverAuthToken}` 
        });
        
        expect(response.status).toEqual(409);

        const driverResponse: JSendErrorResponse = response.body;

        expect(driverResponse.message).toEqual(ErrorReason.AccountExists);

        done();    
    }); 
    
    it("gets driver by token, should return 200 - OK", async (done) => {
        const response = await request(app)
            .get(basePath)
            .set({
                "Authorization": `Bearer ${driverAuthToken}` 
            });
        
        expect(response.status).toEqual(200);

        const driverResponse = getJSendSuccessResponse<"driver", PublicDriver>(response.body);
        const driver = driverResponse.data.driver;
        
        expect(driverResponse.status).toEqual(JSendResponseStatus.Success);

        validateDriver(driver, driverID);

        done();
    }); 
    
    
    it("gets driver by id, should return 200 - OK", async (done) => {
        const response = await request(app)
            .get(`${basePath}/${driverID}`)
            .set({
                "Authorization": `Bearer ${driverAuthToken}` 
            });
        
        expect(response.status).toEqual(200);

        const driverResponse = getJSendSuccessResponse<"driver", PublicDriver>(response.body);
        const driver = driverResponse.data.driver;
        
        expect(driverResponse.status).toEqual(JSendResponseStatus.Success);

        validateDriver(driver, driverID);

        done();
    }); 

    it("gets driver by wrong id, should return 403 - Forbidden", async (done) => {
        const response = await request(app)
            .get(`${basePath}/${driverID}1`)
            .set({
                "Authorization": `Bearer ${driverAuthToken}` 
            });
        
        expect(response.status).toEqual(403);

        const driverResponse: JSendErrorResponse = response.body;

        expect(driverResponse.status).toEqual(JSendResponseStatus.Error);
        expect(driverResponse.message).toEqual(ErrorReason.Forbidden);
        expect(driverResponse.code).toBeNull;
        expect(driverResponse.data).toBeNull;

        done();
    }); 

    
    it("deletes driver by wrong id, should return 403 - Forbidden ", async (done) => {
        const response = await request(app)
            .delete(`${basePath}/${driverID}1`)
            .set({
                "Authorization": `Bearer ${driverAuthToken}` 
            });
        
        expect(response.status).toEqual(403);
        
        const driverResponse: JSendErrorResponse = response.body;

        expect(driverResponse.status).toEqual(JSendResponseStatus.Error);
        expect(driverResponse.message).toEqual(ErrorReason.Forbidden);
        expect(driverResponse.code).toBeNull;
        expect(driverResponse.data).toBeNull;

        done();
    });

    
    it("deletes driver by id, should return 200 - OK", async (done) => {
        const response = await request(app)
            .delete(`${basePath}/${driverID}`)
            .set({
                "Authorization": `Bearer ${driverAuthToken}` 
            });
        
        expect(response.status).toEqual(200);

        const deleteResponse = response.body;

        expect(deleteResponse.status).toEqual(JSendResponseStatus.Success);
        expect(deleteResponse.data).toBeNull;

        done();
    });

});