/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");
const fs = require("fs");
class AssetTransfer extends Contract {
  CertDecode(certAsBytes) {
    const cert = new crypto.X509Certificate(certAsBytes);
    const commonName = cert.subject.split("\n")[1].split("=")[1];
    console.log("Common name is ", commonName);
    // this.commonName = commonName;
    return commonName;
  }

  // CreatCompany issues a new asset to the world state with given details.
  async CreateCompany(ctx, compName) {
    try {
      const creator = ctx.stub.getCreator();
      console.log({ creator });
      const mspID = creator.mspid;

      const commonName = this.CertDecode(creator.idBytes);
      const timestamp = ctx.stub.getDateTimestamp();
      console.log({ timestamp });

      const organization = {
        Organization: mspID,
        User: commonName,
        CompanyName: compName,
        Timestamp: timestamp,
        MemberList: [],
      };

      console.log({ organization });

      await ctx.stub.putState(
        organization.CompanyName,
        Buffer.from(JSON.stringify(organization))
      );

      return JSON.stringify(organization);
    } catch (error) {
      console.log("error in CreateCompany", error);
    }
  }

  async AddMember(ctx, compName, memberName) {
    try {
      const creator = ctx.stub.getCreator();
      const commonName = this.CertDecode(creator.idBytes);
      const companyDetailsAsBytes = await ctx.stub.getState(compName);
      console.log({ companyDetailsAsBytes });
      console.log("companyDetails: ", companyDetailsAsBytes.toString());

      const companyDetails = JSON.parse(companyDetailsAsBytes.toString());
      console.log({ companyDetails });
      console.log("Company created by: ", companyDetails.User);
      console.log("Adding member to the company: ", companyDetails.CompanyName);
      console.log("member list: ", companyDetails.MemberList);

      companyDetails.MemberList.push(memberName);

      if (companyDetails.User !== commonName) {
        throw new Error(`Only user can add the members to the company`);
      } else
        await ctx.stub.putState(
          compName,
          Buffer.from(JSON.stringify(companyDetails))
        );
      return JSON.stringify(companyDetails.MemberList);
    } catch (error) {
      console.log("error in AddMember", error);
    }
  }

  async DisplayMembers(ctx, compName) {
    try {
      const creator = ctx.stub.getCreator();
      const commonName = this.CertDecode(creator.idBytes);
      const companyDetailsAsBytes = await ctx.stub.getState(compName);
      const companyDetails = JSON.parse(companyDetailsAsBytes.toString());

      return companyDetails.MemberList;
    } catch (error) {
      console.log("error in DisplayMembers", error);
    }
  }

  async LeaveCompany(ctx, compName, memberName) {
    const companyDetailsAsBytes = await ctx.stub.getState(compName);
    const companyDetails = JSON.parse(companyDetailsAsBytes.toString());

    for (let index = 0; index < companyDetails.MemberList.length; index++) {
      if (companyDetails.MemberList[index] == memberName) {
        console.log("index value is: ", index);
        companyDetails.MemberList.splice(index, 1);
      }
    }
    console.log("New members list: ", companyDetails.MemberList);
    return companyDetails.MemberList;
    console.log("Member deleted: ", memberName);

    await ctx.stub.putState(
      compName,
      Buffer.from(JSON.stringify(companyDetails))
    );
    return JSON.stringify(companyDetails.MemberList);
  }
}

module.exports = AssetTransfer;
